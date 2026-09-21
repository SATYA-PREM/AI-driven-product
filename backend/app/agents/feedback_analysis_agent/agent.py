"""
agent.py
--------
Feedback Analysis Agent (Agent 1 of Milestone 2).
Responsible for analyzing individual unclassified customer feedback records.

Input: One raw/AI-ready record.
Output: Validated 10-dimension structured analysis saved to MongoDB.
"""

from __future__ import annotations

import re
import time
from typing import Any

from app.core.logging import get_logger
from app.core.constants import DEFAULT_PRODUCT_THEMES, LOW_CONFIDENCE_THRESHOLD
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompt_manager import prompt_manager
from app.agents.feedback_analysis_agent import tools
from app.agents.feedback_analysis_agent.prompts import (
    FEEDBACK_ANALYSIS_AGENT_NAME,
    FEEDBACK_ANALYSIS_AGENT_ROLE,
    FEEDBACK_ANALYSIS_AGENT_GOAL,
    FEEDBACK_ANALYSIS_AGENT_BACKSTORY,
)
from app.schemas.analysis import FeedbackAnalysisOutput

logger = get_logger(__name__)


class FeedbackAnalysisAgent:
    """Agent 1: Individual customer feedback understanding agent."""

    def __init__(self):
        self.name = FEEDBACK_ANALYSIS_AGENT_NAME
        self.role = FEEDBACK_ANALYSIS_AGENT_ROLE
        self.goal = FEEDBACK_ANALYSIS_AGENT_GOAL
        self.backstory = FEEDBACK_ANALYSIS_AGENT_BACKSTORY
        self._tools = {
            "get_feedback_record": tools.get_feedback_record,
            "get_product_taxonomy": tools.get_product_taxonomy,
            "validate_feedback_analysis": tools.validate_feedback_analysis,
            "save_feedback_analysis": tools.save_feedback_analysis,
            "get_similar_feedback": tools.get_similar_feedback,
        }

    def execute_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """Execute a controlled tool by name."""
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        return self._tools[tool_name](**kwargs)

    def analyze_record(
        self,
        record: dict[str, Any],
        workspace_id: str = "",
        dataset_id: str = "",
        analysis_version: str = "v1",
        job_id: str = "",
    ) -> dict[str, Any]:
        """
        Analyze a single customer feedback record across 10 dimensions.
        Validates with Pydantic and persists into MongoDB.
        """
        orig = record.get("original_record") or {}
        feedback_id = (
            record.get("feedback_id")
            or record.get("source_id")
            or record.get("signal_id")
            or record.get("source_record_id")
            or orig.get("feedback_id")
            or orig.get("customer_id")
            or "UNKNOWN"
        )
        workspace_id = workspace_id or record.get("workspace_id", "")
        dataset_id = dataset_id or record.get("dataset_id", "")

        prompt = prompt_manager.build_feedback_analysis_prompt(record)

        def fallback_analyzer(_: str) -> dict[str, Any]:
            return self._heuristic_fallback_analysis(record, feedback_id)

        raw_output = gemini_client.generate_json(
            prompt=prompt,
            system_instruction=self.backstory,
            fallback_fn=fallback_analyzer,
        )

        # Validate with Pydantic
        is_valid, validated_model, errors = tools.validate_feedback_analysis(raw_output)
        if not is_valid or validated_model is None:
            logger.warning(f"Feedback analysis validation failed for record {feedback_id}: {errors}. Using normalized fallback.")
            fallback_dict = self._heuristic_fallback_analysis(record, feedback_id)
            _, validated_model, _ = tools.validate_feedback_analysis(fallback_dict)

        analysis_dict = validated_model.model_dump()

        # Persist to MongoDB
        if workspace_id and dataset_id:
            orig = record.get("original_record") or {}
            orig_text = str(
                record.get("text")
                or record.get("feedback_text")
                or record.get("feedback")
                or orig.get("feedback_text")
                or orig.get("text")
                or orig.get("feedback")
                or ""
            )
            src = str(record.get("source") or orig.get("source") or record.get("platform") or "web")
            cat = str(record.get("category") or orig.get("category") or analysis_dict.get("theme", "general"))
            tools.save_feedback_analysis(
                analysis_data=analysis_dict,
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                feedback_id=feedback_id,
                model="gemini" if gemini_client.is_available else "heuristic_fallback",
                analysis_version=analysis_version,
                job_id=job_id,
                original_text=orig_text,
                source=src,
                category=cat,
            )

        return analysis_dict

    def analyze_batch(
        self,
        records: list[dict[str, Any]],
        workspace_id: str,
        dataset_id: str,
        analysis_version: str = "v1",
        job_id: str = "",
    ) -> dict[str, Any]:
        """
        Process a batch of feedback records through Agent 1 in consolidated chunks.
        Employs batch LLM inference for fast, simultaneous processing of all records at once.
        """
        total = len(records)
        completed = 0
        failed = 0
        low_confidence = 0
        results = []

        logger.info(f"Agent 1: Beginning batch analysis of {total} records for dataset={dataset_id} (job={job_id})")

        # Process in chunks of up to 30 records per LLM call
        CHUNK_SIZE = 30
        for chunk_idx in range(0, total, CHUNK_SIZE):
            t_chunk_start = time.perf_counter()
            chunk = records[chunk_idx : chunk_idx + CHUNK_SIZE]

            chunk_results = None
            if gemini_client.is_available:
                try:
                    prompt = prompt_manager.build_batch_feedback_analysis_prompt(chunk)
                    raw_batch = gemini_client.generate_json(
                        prompt=prompt,
                        system_instruction=self.backstory,
                    )
                    if isinstance(raw_batch, list) and len(raw_batch) > 0:
                        chunk_results = raw_batch
                    elif isinstance(raw_batch, dict) and "records" in raw_batch and isinstance(raw_batch["records"], list):
                        chunk_results = raw_batch["records"]
                except Exception as e:
                    logger.warning(f"Batch LLM call failed for chunk {chunk_idx}: {e}. Falling back to in-memory heuristic analysis.")

            result_map = {}
            if chunk_results:
                for item in chunk_results:
                    if isinstance(item, dict) and item.get("feedback_id"):
                        result_map[str(item["feedback_id"])] = item

            chunk_analyses = []
            for rec in chunk:
                orig = rec.get("original_record") or {}
                feedback_id = (
                    rec.get("feedback_id")
                    or rec.get("source_id")
                    or rec.get("signal_id")
                    or rec.get("source_record_id")
                    or orig.get("feedback_id")
                    or orig.get("customer_id")
                    or str(rec.get("_id", "UNKNOWN"))
                )

                raw_output = result_map.get(str(feedback_id))
                if raw_output:
                    is_valid, validated_model, _ = tools.validate_feedback_analysis(raw_output)
                    if not is_valid or validated_model is None:
                        fallback_dict = self._heuristic_fallback_analysis(rec, str(feedback_id))
                        _, validated_model, _ = tools.validate_feedback_analysis(fallback_dict)
                else:
                    # Fast targeted fallback without initiating individual network round-trips
                    fallback_dict = self._heuristic_fallback_analysis(rec, str(feedback_id))
                    _, validated_model, _ = tools.validate_feedback_analysis(fallback_dict)

                if validated_model:
                    analysis_dict = validated_model.model_dump()
                    orig = rec.get("original_record") or {}
                    analysis_dict["original_text"] = str(
                        rec.get("text")
                        or rec.get("feedback_text")
                        or rec.get("feedback")
                        or orig.get("feedback_text")
                        or orig.get("text")
                        or orig.get("feedback")
                        or ""
                    )
                    analysis_dict["source"] = str(rec.get("source") or orig.get("source") or rec.get("platform") or "web")
                    analysis_dict["category"] = str(rec.get("category") or orig.get("category") or analysis_dict.get("theme", "general"))
                    analysis_dict["device"] = str(rec.get("device") or orig.get("device") or "")
                    analysis_dict["user_id"] = str(rec.get("user_id") or orig.get("user_id") or rec.get("customer_id") or orig.get("customer_id") or "")
                    analysis_dict["app_version"] = str(rec.get("app_version") or orig.get("app_version") or "")
                    analysis_dict["date_str"] = str(rec.get("date") or rec.get("created_at") or orig.get("date") or "")

                    chunk_analyses.append(analysis_dict)
                    results.append(analysis_dict)
                    completed += 1
                    if analysis_dict.get("overall_confidence", 1.0) < LOW_CONFIDENCE_THRESHOLD:
                        low_confidence += 1
                else:
                    failed += 1

            # Single bulk MongoDB persistence for the entire chunk
            if workspace_id and dataset_id and chunk_analyses:
                tools.save_batch_feedback_analysis(
                    analyses_data=chunk_analyses,
                    workspace_id=workspace_id,
                    dataset_id=dataset_id,
                    model="gemini" if gemini_client.is_available else "heuristic_fallback",
                    analysis_version=analysis_version,
                    job_id=job_id,
                )

            chunk_duration = time.perf_counter() - t_chunk_start
            logger.info(
                f"Agent 1 Chunk [{chunk_idx + 1}-{min(chunk_idx + CHUNK_SIZE, total)}/{total}] processed & bulk-saved in {chunk_duration:.2f}s"
            )

        logger.info(
            f"Agent 1 batch complete: total={total}, completed={completed}, failed={failed}, low_conf={low_confidence}"
        )

        return {
            "total_records": total,
            "completed_count": completed,
            "failed_count": failed,
            "low_confidence_count": low_confidence,
            "status": "completed" if failed == 0 else "partial_failure",
            "results": results,
        }

    def _heuristic_fallback_analysis(self, record: dict[str, Any], feedback_id: str) -> dict[str, Any]:
        """Deterministic NLP rule-based fallback when offline or LLM fails."""
        orig = record.get("original_record") or {}
        text = str(
            record.get("text")
            or record.get("feedback_text")
            or record.get("feedback")
            or orig.get("feedback_text")
            or orig.get("text")
            or orig.get("feedback")
            or ""
        ).strip()
        lower = text.lower()
        rating = record.get("rating") if record.get("rating") is not None else orig.get("rating")

        # 1. Sentiment
        if rating is not None and str(rating).isdigit():
            r = int(rating)
            if r <= 2:
                sentiment = "negative"
            elif r == 3:
                sentiment = "neutral"
            else:
                sentiment = "positive"
        elif any(w in lower for w in ["love", "great", "excellent", "good", "helpful", "awesome", "fast"]):
            sentiment = "positive" if not any(w in lower for w in ["slow", "bug", "crash", "error", "not"]) else "mixed"
        elif any(w in lower for w in ["crash", "freeze", "fail", "broken", "terrible", "bad", "slow", "error", "hate", "issue", "timed out"]):
            sentiment = "negative"
        else:
            sentiment = "neutral"

        # Check for feature request patterns
        feature_phrases = [
            "please add", "would like", "feature", "wish", "suggestion", "request", "support for",
            "can we", "can you", "could we", "could you", "we need", "i need", "need to", "is needed",
            "would help", "would be", "would make", "should be able", "allow us", "enable", "schedule",
            "webhook", "dependencies", "bulk", "compare", "preferred filter", "easier if", "cleaner if",
        ]
        has_feature_demand = any(p in lower for p in feature_phrases)

        # 2. Intent
        if any(w in lower for w in ["crash", "freeze", "bug", "broken", "error", "fail", "exception", "timed out"]):
            intent = "bug_report"
        elif has_feature_demand:
            intent = "feature_request"
        elif any(w in lower for w in ["why", "how", "what", "where", "?"]):
            intent = "question"
        elif sentiment == "positive":
            intent = "praise"
        elif sentiment == "negative":
            intent = "complaint"
        else:
            intent = "general_feedback"

        # 3. Theme & Product Area
        theme = "general"
        product_area = "general"
        for t in DEFAULT_PRODUCT_THEMES:
            if t in lower:
                theme = t
                product_area = f"{t}_core"
                break
        if theme == "general":
            if any(w in lower for w in ["pay", "checkout", "card", "transaction"]):
                theme = "checkout"
                product_area = "payment_confirmation"
            elif any(w in lower for w in ["login", "password", "sign in", "auth"]):
                theme = "authentication"
                product_area = "user_authentication"
            elif any(w in lower for w in ["report", "export", "csv", "download"]):
                theme = "reporting"
                product_area = "report_export"
            elif any(w in lower for w in ["search", "find", "filter"]):
                theme = "search"
                product_area = "search_filters"

        # 4. Pain points, issues, feature requests
        pain_points = []
        issues = []
        feature_requests = []

        if intent in ["bug_report", "complaint"]:
            issues.append(text[:80] if text else f"{theme.title()} error encountered")
            pain_points.append(f"Customer encountered difficulty with {theme}")

        if intent == "feature_request" or has_feature_demand:
            feature_requests.append(text[:80] if text else f"Enhancement requested for {theme}")

        if not issues and not feature_requests:
            if sentiment == "negative":
                issues.append(text[:80] if text else "Usability concern reported")
            else:
                feature_requests.append(text[:80] if text else f"General feedback for {theme}")

        # 5. Keywords
        words = re.findall(r"\b[a-zA-Z]{4,15}\b", lower)
        stopwords = {"this", "that", "with", "have", "from", "when", "after", "there", "their", "about", "could", "would"}
        keywords = list(dict.fromkeys([w for w in words if w not in stopwords]))[:5]

        # 6. Enriched Diagnostic Dimensions
        if any(w in lower for w in ["crash", "freeze", "fail", "broken", "security", "lost money", "cannot login", "urgent", "critical"]):
            urgency_level = "critical" if any(w in lower for w in ["security", "lost money", "data loss"]) else "high"
            customer_impact = "High disruption: users are blocked from completing key workflows or encountering system instability."
            suggested_action = "Immediate engineering investigation and hotfix deployment required."
            root_cause_hint = f"Potential regression or exception in {product_area} subsystem."
        elif sentiment == "negative" or intent == "complaint":
            urgency_level = "medium"
            customer_impact = "Moderate friction: users experience frustration or delays during operation."
            suggested_action = "Queue for upcoming sprint review and review UX workflow."
            root_cause_hint = f"Suboptimal error handling or UI friction in {theme} flow."
        elif intent == "feature_request" or has_feature_demand:
            urgency_level = "medium" if any(w in lower for w in ["need", "must have", "blocker"]) else "low"
            customer_impact = "Feature gap: user efficiency or adoption is constrained without this capability."
            suggested_action = "Prioritize feature backlog consideration in product roadmap planning."
            root_cause_hint = f"Missing capability in {theme} module."
        else:
            urgency_level = "low"
            customer_impact = "Low or informational: general sentiment and engagement signal."
            suggested_action = "Track metrics and archive feedback for user research."
            root_cause_hint = "No system defect identified."

        source_platform = str(record.get("source") or orig.get("source") or record.get("platform") or "Web App").title()

        return {
            "feedback_id": feedback_id,
            "sentiment": sentiment,
            "sentiment_confidence": 0.88,
            "intent": intent,
            "intent_confidence": 0.85,
            "theme": theme,
            "theme_confidence": 0.87,
            "product_area": product_area,
            "pain_points": pain_points,
            "issues": issues,
            "feature_requests": feature_requests,
            "keywords": keywords,
            "overall_confidence": 0.89,
            "urgency_level": urgency_level,
            "customer_impact": customer_impact,
            "suggested_action": suggested_action,
            "root_cause_hint": root_cause_hint,
            "source_platform": source_platform,
        }

    def create_crew_agent(self, llm: Any = None):
        """CrewAI agent constructor (if crewai package is available)."""
        try:
            from crewai import Agent
            agent_kwargs: dict[str, Any] = {
                "role": self.role,
                "goal": self.goal,
                "backstory": self.backstory,
                "tools": tools.CREW_AGENT_1_TOOLS,
                "verbose": True,
                "allow_delegation": False,
            }
            if llm is not None:
                agent_kwargs["llm"] = llm
            return Agent(**agent_kwargs)
        except ImportError:
            logger.debug("CrewAI is not installed; FeedbackAnalysisAgent operates via native execution.")
            return None


feedback_analysis_agent = FeedbackAnalysisAgent()

