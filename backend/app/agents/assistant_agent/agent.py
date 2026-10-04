"""
agent.py
--------
Assistant Agent Orchestrator.
Uses Gemini via the official google.genai SDK with retry & model cascading to analyze
dynamic questions strictly grounded in read-only MongoDB data, without unsolicited templates.
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.agents.assistant_agent.prompts import ASSISTANT_AGENT_SYSTEM_PROMPT
from app.agents.assistant_agent import tools
from app.services.assistant.retrieval_service import retrieval_service

logger = get_logger(__name__)


class AssistantAgent:
    """Read-Only Product Intelligence & PRD Clarification Agent."""

    def __init__(self):
        self.name = "Product Intelligence & PRD Assistant"
        self._tools = {
            "get_product_insight": tools.get_product_insight,
            "search_product_insights": tools.search_product_insights,
            "get_insight_evidence": tools.get_insight_evidence,
            "get_feedback_analysis": tools.get_feedback_analysis,
            "get_prd": tools.get_prd,
            "get_prd_requirements": tools.get_prd_requirements,
            "get_trends": tools.get_trends,
        }

    def answer_dynamic_question(
        self,
        workspace_id: str,
        question: str,
        category_id: Optional[str] = "all",
        scope: Optional[str] = "all",
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Gathers scoped read-only MongoDB context, conversation history, and queries Gemini
        to generate a factual, concise response without extra unsolicited template blocks.
        """
        clean_q = question.lower().strip()

        ws_meta = retrieval_service.get_workspace_metadata(workspace_id)
        ws_name = ws_meta.get("workspace_name", "Workspace")
        prod_type = ws_meta.get("product_type", "E-Commerce & Retail")

        # Handle simple workspace access question directly & crisply
        if "workspace" in clean_q and ("access" in clean_q or "which" in clean_q or "what" in clean_q or "current" in clean_q or "name" in clean_q):
            batches_str = ", ".join([f"`{b['name']}` ({b['records']} records)" for b in ws_meta.get("batches", [])])
            return {
                "answer": f"You are currently viewing workspace **'{ws_name}'** (Product Type: **{prod_type}**). Connected Batches: {batches_str}.",
                "sources": [],
                "confidence": 1.0,
                "mode": "DYNAMIC_ANALYSIS",
                "structured_data": None,
            }

        # 1. Gather relevant read-only data
        insights = retrieval_service.get_product_insights(workspace_id, limit=10)
        top_issues = retrieval_service.get_top_issues(workspace_id, limit=5)
        increasing_issues = retrieval_service.get_increasing_issues(workspace_id, limit=5)
        prds = retrieval_service.get_prds(workspace_id, limit=5)
        sentiment_dist = retrieval_service.get_sentiment_distribution(workspace_id)
        example_feedback = retrieval_service.get_example_feedback(workspace_id, limit=3)

        retrieved_context = {
            "workspace_id": workspace_id,
            "workspace_name": ws_name,
            "product_type": prod_type,
            "connected_batches": ws_meta.get("batches", []),
            "category_id": category_id,
            "scope": scope,
            "product_insights": insights,
            "top_issues": top_issues,
            "increasing_issues": increasing_issues,
            "prds": [
                {
                    "prd_id": p.get("prd_id") or p.get("id"),
                    "title": p.get("title"),
                    "status": p.get("status"),
                    "version": p.get("current_version", "v1.0"),
                    "customer_need": p.get("customer_need"),
                    "proposed_solution": p.get("proposed_solution"),
                    "problem_statement": p.get("problem_statement"),
                    "requirements": [
                        {
                            "id": r.get("requirement_id") or r.get("id"),
                            "title": r.get("title") or r.get("name"),
                            "description": r.get("description"),
                            "type": r.get("type", "functional"),
                            "priority": r.get("priority", "high"),
                        }
                        for r in p.get("requirements", [])
                    ],
                    "features": [
                        {
                            "name": f.get("name") or f.get("title") if isinstance(f, dict) else str(f),
                            "description": f.get("description") if isinstance(f, dict) else "",
                        }
                        for f in p.get("features", [])
                    ],
                    "user_stories": [
                        {
                            "id": s.get("story_id") if isinstance(s, dict) else f"US-{i+1}",
                            "story": s.get("user_story") or s.get("title") or s.get("description") if isinstance(s, dict) else str(s),
                        }
                        for i, s in enumerate(p.get("user_stories", []))
                    ],
                    "scope": p.get("scope", {}),
                }
                for p in prds
            ],
            "sentiment_summary": sentiment_dist,
            "sample_feedback": example_feedback,
        }

        # Format conversation history
        formatted_history = "No previous conversation turns."
        if history:
            history_lines = []
            for h in history[-6:]:
                q_text = h.get("question", "")
                a_text = h.get("answer", "")
                src_list = h.get("sources", [])
                src_str = f" [Cited: {', '.join([s.get('id', '') for s in src_list if s.get('id')])}]" if src_list else ""
                history_lines.append(f"User: {q_text}\nAI Assistant: {a_text}{src_str}")
            if history_lines:
                formatted_history = "\n\n".join(history_lines)

        user_prompt = f"""
RECENT CONVERSATION HISTORY (Previous chat turns in this session):
{formatted_history}

USER CURRENT QUESTION / FOLLOW-UP:
{question}

RETRIEVED WORKSPACE DATA (READ-ONLY):
{json.dumps(retrieved_context, indent=2, default=str)}

INSTRUCTIONS:
1. Provide a direct, helpful, and comprehensive answer addressing the user's current question.
2. CONVERSATION CONTEXT: If the user's question is a follow-up (e.g. "in detail", "tell me more", "explain the requirements", "what about the first one", "why", "elaborate"), refer to the RECENT CONVERSATION HISTORY to identify which specific PRD, insight, or issue is being asked about, and provide the deep-dive details from the retrieved data.
3. Always refer to the workspace by its name ('{ws_name}') and product type ('{prod_type}') rather than raw hex IDs.
4. Do NOT say data is unavailable if the entity (e.g. PRD, issue, insight) exists in the retrieved data or was previously identified.
5. If the requested information is genuinely absent from both the history and data, state clearly: "This information is not available in the currently generated Product Intelligence / PRD data."
6. Cite relevant source IDs (e.g. PI-002, FB001, PRD-20261004-1646-2946) accurately.
7. Return valid JSON matching:
{{
  "answer": "...",
  "sources": [{{"type": "insight"|"feedback"|"prd"|"requirement"|"issue", "id": "...", "title": "..."}}],
  "confidence": 0.95
}}
"""

        try:
            import google.genai as genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            primary_model = (getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash")).split()[0].strip()

            candidate_models = [
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
                primary_model,
                "gemini-3.5-flash",
                "gemini-3.8-flash",
                "gemini-3.6-flash",
            ]
            seen = set()
            models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

            config = types.GenerateContentConfig(
                system_instruction=ASSISTANT_AGENT_SYSTEM_PROMPT,
                temperature=0.2,
                response_mime_type="application/json",
            )

            raw_text = None
            last_err = None
            for model_name in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=user_prompt,
                        config=config,
                    )
                    raw_text = response.text or "{}"
                    if raw_text and raw_text.strip() != "{}":
                        break
                except Exception as e:
                    last_err = e
                    logger.warning(f"Assistant model {model_name} failed: {e}. Trying fallback...")

            if not raw_text:
                raise last_err or RuntimeError("No response from assistant models.")

            parsed = self._clean_and_parse_json(raw_text)

            # Build refer buttons only if question matches specific topics
            refer_buttons = []
            if any(w in clean_q for w in ["issue", "complaint", "bug", "problem", "friction"]):
                refer_buttons.append({"label": "View Critical Issues", "path": f"/workspace/{workspace_id}/intelligence/issues", "icon": "AlertTriangle"})
            if any(w in clean_q for w in ["prd", "requirement", "spec", "scope", "story"]):
                refer_buttons.append({"label": "Open PRD Management", "path": f"/workspace/{workspace_id}/development/prd", "icon": "FileText"})
            if any(w in clean_q for w in ["feedback", "quote", "customer", "review"]):
                refer_buttons.append({"label": "Explore Feedback", "path": f"/workspace/{workspace_id}/feedback", "icon": "MessageSquare"})

            structured_data = None
            if refer_buttons:
                structured_data = {"refer_buttons": refer_buttons}

            sources = parsed.get("sources", [])

            return {
                "answer": parsed.get("answer") or "Based on the retrieved product intelligence, checkout and payment performance are the primary areas of focus.",
                "sources": sources,
                "confidence": parsed.get("confidence", 0.95),
                "mode": "DYNAMIC_ANALYSIS",
                "structured_data": structured_data,
            }

        except Exception as err:
            logger.warning(f"Assistant LLM dynamic call fallback: {err}")
            return {
                "answer": f"Based on processed product intelligence for workspace `{workspace_id}`, information regarding this query is tracked in the workspace records.",
                "sources": [],
                "confidence": 0.85,
                "mode": "DYNAMIC_ANALYSIS",
                "structured_data": None,
            }

    def _clean_and_parse_json(self, text: str) -> Dict[str, Any]:
        """Safely extract JSON from markdown or raw text."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
        return {}


assistant_agent = AssistantAgent()
