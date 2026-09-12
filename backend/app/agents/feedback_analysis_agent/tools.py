"""
tools.py
--------
Controlled tool functions for Agent 1 (Feedback Analysis Agent).
Prevents direct unrestricted database access from AI models.

Pattern:
    Agent → Tool → Service / Repository → MongoDB
"""

from __future__ import annotations

from typing import Any
from app.core.constants import DEFAULT_PRODUCT_THEMES, LOW_CONFIDENCE_THRESHOLD
from app.core.exceptions import NotFoundError
from app.repositories.data_repository import data_repository
from app.repositories.analysis_repository import analysis_repository
from app.models.ai_analysis import AIAnalysisModel
from app.services.ai.response_parser import response_parser
from app.schemas.analysis import FeedbackAnalysisOutput


try:
    from crewai.tools import tool as crewai_tool
except ImportError:
    def crewai_tool(name_or_func=None, **kwargs):
        def decorator(f):
            return f
        if callable(name_or_func):
            return name_or_func
        return decorator


def get_feedback_record(feedback_id: str, dataset_id: str | None = None) -> dict[str, Any]:
    """Retrieve an individual AI-ready feedback record from the repository."""
    # Look in processed_data first, fallback to raw_data
    if dataset_id:
        processed = data_repository.get_processed_records(dataset_id, limit=200)
        for r in processed:
            if r.get("source_id") == feedback_id or r.get("signal_id") == feedback_id:
                return r

        raw = data_repository.get_raw_records(dataset_id, limit=200)
        for r in raw:
            if (
                r.get("feedback_id") == feedback_id
                or r.get("customer_id") == feedback_id
                or r.get("review_id") == feedback_id
                or r.get("ticket_id") == feedback_id
            ):
                return r

    raise NotFoundError("FeedbackRecord", feedback_id)


get_feedback_record_tool = crewai_tool("get_feedback_record")(get_feedback_record)


def get_product_taxonomy() -> dict[str, Any]:
    """Retrieve allowed product themes and classification taxonomies."""
    return {
        "themes": DEFAULT_PRODUCT_THEMES,
        "sentiments": ["positive", "negative", "neutral", "mixed"],
        "intents": [
            "complaint",
            "bug_report",
            "feature_request",
            "question",
            "praise",
            "general_feedback",
        ],
    }


get_product_taxonomy_tool = crewai_tool("get_product_taxonomy")(get_product_taxonomy)


def validate_feedback_analysis(analysis_data: dict[str, Any]) -> tuple[bool, FeedbackAnalysisOutput | None, list[str]]:
    """Validate generated analysis dictionary against the Pydantic schema."""
    return response_parser.validate_feedback_analysis(analysis_data)


@crewai_tool("validate_feedback_analysis_tool")
def validate_feedback_analysis_tool(analysis_data: dict[str, Any]) -> dict[str, Any]:
    """Validate generated analysis dictionary against the Pydantic schema for CrewAI."""
    is_valid, parsed, errors = response_parser.validate_feedback_analysis(analysis_data)
    return {
        "is_valid": is_valid,
        "errors": errors,
        "validated_data": parsed.model_dump() if parsed else None,
    }


def save_feedback_analysis(
    analysis_data: dict[str, Any],
    workspace_id: str,
    dataset_id: str,
    feedback_id: str,
    model: str = "gemini",
    analysis_version: str = "v1",
) -> str:
    """
    Persist the validated analysis into MongoDB analyses collection.
    Flags low-confidence classifications (< 0.60) for review.
    """
    overall_conf = float(analysis_data.get("overall_confidence", 0.90))
    status = "low_confidence" if overall_conf < LOW_CONFIDENCE_THRESHOLD else "completed"

    doc = AIAnalysisModel.create_document(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        feedback_id=feedback_id,
        analysis=analysis_data,
        confidence=overall_conf,
        model=model,
        analysis_version=analysis_version,
        processing_status=status,
    )
    return analysis_repository.save_analysis(doc)


save_feedback_analysis_tool = crewai_tool("save_feedback_analysis")(save_feedback_analysis)


def get_similar_feedback(theme: str, limit: int = 5) -> list[dict[str, Any]]:
    """Optionally fetch previously analyzed records in the same theme for reference."""
    cursor = analysis_repository.collection.find({"analysis.theme": theme.lower()}).limit(limit)
    return list(cursor)


get_similar_feedback_tool = crewai_tool("get_similar_feedback")(get_similar_feedback)


CREW_AGENT_1_TOOLS = [
    get_feedback_record_tool,
    get_product_taxonomy_tool,
    validate_feedback_analysis_tool,
    save_feedback_analysis_tool,
    get_similar_feedback_tool,
]

