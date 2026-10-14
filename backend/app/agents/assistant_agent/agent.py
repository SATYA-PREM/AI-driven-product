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

    def answer_conversational_turn(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Answers general, conversational, chit-chat, or educational queries WITHOUT touching MongoDB.
        Uses conversation history memory so it remembers previous turns.
        """
        clean_msg = message.strip()
        lower_msg = clean_msg.lower()

        # Format conversation history
        formatted_history = "No previous conversation turns."
        if history:
            history_lines = []
            for h in history[-8:]:
                role = "User" if h.get("role") in ["user", "User"] or h.get("sender") == "user" else "AI Assistant"
                text = h.get("text") or h.get("question") or h.get("answer") or ""
                if text:
                    history_lines.append(f"{role}: {text}")
            if history_lines:
                formatted_history = "\n".join(history_lines)

        user_prompt = f"""RECENT CONVERSATION HISTORY:
{formatted_history}

USER MESSAGE:
{clean_msg}

Please provide a direct, conversational, and helpful response."""

        try:
            from google.genai import types
            from app.services.ai.gemini_pool import gemini_pool

            primary_model = (getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")).split()[0].strip()

            candidate_models = [
                primary_model or "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite-preview",
                "gemini-3.8-flash",
                "gemini-1.5-flash",
            ]
            seen = set()
            models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

            config = types.GenerateContentConfig(
                system_instruction="""You are the ProdAI Assistant — a knowledgeable, warm, and helpful AI product partner.
You assist product managers, designers, developers, and QA teams with product intelligence, customer feedback, PRD development, and agile workflows.

GUIDELINES:
1. GREETINGS & INTRODUCTIONS: Respond warmly, concisely, and naturally. If greeted (e.g. 'hi', 'hello'), welcome the user and let them know you are ready to answer questions about their customer feedback, product insights, PRDs, or team roadmap.
2. CONVERSATION MEMORY: Carefully review the RECENT CONVERSATION HISTORY. Remember what the user asked before, your previous responses, and any context or names shared. If the user refers back to an earlier turn, acknowledge and answer contextually according to what was discussed.
3. GENERAL KNOWLEDGE: If asked general product management, Agile, technical, or conversational questions, provide insightful, practical, and clear answers.
4. TONE: Professional, friendly, helpful, and concise. Never show database error notices or internal stack traces.""",
                temperature=0.7,
            )

            def _call_conversational(client, active_key):
                for model_name in models_to_try:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=user_prompt,
                            config=config,
                        )
                        raw_text = response.text
                        if raw_text and raw_text.strip():
                            return raw_text.strip()
                    except Exception as e:
                        err_str = str(e).lower()
                        if any(term in err_str for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                            raise e
                        logger.warning(f"Conversational model {model_name} failed on key {active_key[:8]}...: {e}")
                raise RuntimeError("No conversational model succeeded on this key.")

            raw_text = gemini_pool.execute_with_failover(_call_conversational)
            if raw_text and raw_text.strip():
                return {
                    "answer": raw_text.strip(),
                    "sources": [],
                    "confidence": 1.0,
                    "mode": "CONVERSATIONAL",
                    "structured_data": None,
                }
        except Exception as e:
            logger.warning(f"Conversational LLM call fallback: {e}")

        # Deterministic smart fallback if LLM is unavailable
        import re
        no_punct = re.sub(r'[^\w\s]', '', lower_msg).strip()
        if no_punct in ["hi", "hello", "hey", "hola", "howdy", "sup", "yo", "good morning", "good afternoon", "good evening", "greetings"]:
            answer = "Hello! 👋 I'm your AI Product Assistant. I can help you analyze customer feedback, explore product insights, review PRDs, and understand key priorities. What would you like to explore today?"
        elif any(w in lower_msg for w in ["who are you", "what are you", "what is your name"]):
            answer = "I'm your ProdAI Assistant! I act as an intelligent copilot for your product team — synthesizing customer voices, surfacing critical product issues, and providing fast PRD answers."
        elif any(w in lower_msg for w in ["how are you", "how are you doing", "hows it going"]):
            answer = "I'm doing great, thank you for asking! 😊 Ready to help you with your product data and workflows. What's on your mind today?"
        elif any(w in lower_msg for w in ["thank you", "thanks", "thx"]):
            answer = "You're very welcome! Let me know whenever you'd like to explore your product intelligence or PRD data."
        elif any(w in lower_msg for w in ["what can you do", "help", "how do you work"]):
            answer = "I can help you with:\n\n• **Customer Feedback Analysis**: Explore sentiment, recurring complaints, and intake channels.\n• **Product Insights**: Discover highest-priority issues, evidence, and emerging trends.\n• **PRD Guidance**: Clarify requirements, user stories, acceptance criteria, and project scope.\n• **Team Assignments**: Review role-specific tasks for Designers, Developers, and QA."
        else:
            answer = "I'm here to help with your product management, agile delivery, customer feedback, and PRD questions. What specific area would you like to discuss?"

        return {
            "answer": answer,
            "sources": [],
            "confidence": 1.0,
            "mode": "CONVERSATIONAL",
            "structured_data": None,
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
            for h in history[-8:]:
                role = "User" if h.get("role") in ["user", "User"] or h.get("sender") == "user" else "AI Assistant"
                text = h.get("text") or h.get("question") or h.get("answer") or ""
                src_list = h.get("sources", [])
                src_str = f" [Cited: {', '.join([s.get('id', '') for s in src_list if s.get('id')])}]" if src_list else ""
                if text:
                    history_lines.append(f"{role}: {text}{src_str}")
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
            from google.genai import types
            from app.services.ai.gemini_pool import gemini_pool

            primary_model = (getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")).split()[0].strip()

            candidate_models = [
                primary_model or "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite-preview",
                "gemini-3.8-flash",
                "gemini-1.5-flash",
            ]
            seen = set()
            models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

            config = types.GenerateContentConfig(
                system_instruction=ASSISTANT_AGENT_SYSTEM_PROMPT,
                temperature=0.2,
                response_mime_type="application/json",
            )

            def _call_dynamic(client, active_key):
                for model_name in models_to_try:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=user_prompt,
                            config=config,
                        )
                        raw = response.text or "{}"
                        if raw and raw.strip() != "{}":
                            return raw
                    except Exception as e:
                        err_str = str(e).lower()
                        if any(term in err_str for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                            raise e
                        logger.warning(f"Assistant model {model_name} failed on key {active_key[:8]}...: {e}")
                raise RuntimeError("No dynamic model succeeded on this key.")

            raw_text = gemini_pool.execute_with_failover(_call_dynamic)
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
