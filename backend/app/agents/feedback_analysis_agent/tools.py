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


from datetime import datetime, timezone
from pymongo import UpdateOne
from app.core.database import customer_feedback_collection


def save_feedback_analysis(
    analysis_data: dict[str, Any],
    workspace_id: str,
    dataset_id: str,
    feedback_id: str,
    model: str = "gemini",
    analysis_version: str = "v1",
    job_id: str = "",
    original_text: str = "",
    source: str = "Unknown",
    category: str = "General",
) -> str:
    """
    Persist the validated analysis into MongoDB analyses collection AND customer_feedback collection.
    Flags low-confidence classifications (< 0.60) for review.
    """
    overall_conf = float(analysis_data.get("overall_confidence", 0.90))
    status = "low_confidence" if overall_conf < LOW_CONFIDENCE_THRESHOLD else "completed"

    text = original_text or analysis_data.get("original_text", "")
    src = source if source != "Unknown" else analysis_data.get("source", "App Store")
    cat = category if category != "General" else analysis_data.get("theme", "General")

    doc = AIAnalysisModel.create_document(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        feedback_id=feedback_id,
        job_id=job_id,
        analysis=analysis_data,
        confidence=overall_conf,
        model=model,
        analysis_version=analysis_version,
        processing_status=status,
        original_text=text,
        source=src,
        category=cat,
    )
    res = analysis_repository.save_analysis(doc)

    # Sync to customer_feedback_collection
    try:
        s_norm = (analysis_data.get("sentiment") or "neutral").capitalize()
        s_score = 0.85 if s_norm == "Positive" else (-0.85 if s_norm == "Negative" else 0.0)
        u_level = (analysis_data.get("urgency_level") or "medium").capitalize()
        priority_map = {"Critical": "Critical", "High": "High", "Medium": "Medium", "Low": "Low"}
        priority = priority_map.get(u_level, "Medium")
        fb_status = "In Review" if analysis_data.get("intent") in ["complaint", "bug_report"] else "New"
        suggested = (analysis_data.get("feature_requests") or [""])[0] or analysis_data.get("suggested_action")

        fb_doc = {
            "workspace_id": workspace_id,
            "feedback_id": feedback_id,
            "dataset_id": dataset_id,
            "text": text or f"Customer feedback signal {feedback_id}",
            "source": src,
            "sentiment": s_norm,
            "sentiment_score": s_score,
            "category": cat.title(),
            "priority": priority,
            "status": fb_status,
            "assigned_to": "Unassigned",
            "user_id": analysis_data.get("user_id") or f"user_{feedback_id.lower()}",
            "device": analysis_data.get("source_platform") or "Mobile",
            "app_version": analysis_data.get("app_version") or "v2.3.1",
            "date_str": datetime.now(timezone.utc).strftime("%b %d, %Y"),
            "key_issues": analysis_data.get("issues") or analysis_data.get("pain_points") or [],
            "suggested_feature": suggested,
            "topics": analysis_data.get("keywords") or [],
            "created_at": datetime.now(timezone.utc),
        }
        customer_feedback_collection.update_one(
            {"workspace_id": workspace_id, "feedback_id": feedback_id},
            {"$set": fb_doc},
            upsert=True,
        )
    except Exception as e:
        logger.warning(f"Failed to sync feedback {feedback_id} to customer_feedback_collection: {e}")

    return res


save_feedback_analysis_tool = crewai_tool("save_feedback_analysis")(save_feedback_analysis)


def save_batch_feedback_analysis(
    analyses_data: list[dict[str, Any]],
    workspace_id: str,
    dataset_id: str,
    model: str = "gemini",
    analysis_version: str = "v1",
    job_id: str = "",
) -> int:
    """
    Persist multiple validated analyses into MongoDB analyses collection using bulk upsert,
    and simultaneously sync customer_feedback_collection.
    """
    if not analyses_data:
        return 0

    docs = []
    feedback_ops = []
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%b %d, %Y")

    for item in analyses_data:
        f_id = str(item.get("feedback_id", "UNKNOWN"))
        conf = float(item.get("overall_confidence", 0.90))
        st = "low_confidence" if conf < LOW_CONFIDENCE_THRESHOLD else "completed"
        text = item.get("original_text", "")
        src = item.get("source", "App Store")
        cat = item.get("category") or item.get("theme", "General")

        doc = AIAnalysisModel.create_document(
            workspace_id=workspace_id,
            dataset_id=dataset_id,
            feedback_id=f_id,
            job_id=job_id,
            analysis=item,
            confidence=conf,
            model=model,
            analysis_version=analysis_version,
            processing_status=st,
            original_text=text,
            source=src,
            category=cat,
        )
        docs.append(doc)

        # Prepare customer feedback upsert
        s_norm = (item.get("sentiment") or "neutral").capitalize()
        s_score = 0.85 if s_norm == "Positive" else (-0.85 if s_norm == "Negative" else 0.0)
        u_level = (item.get("urgency_level") or "medium").capitalize()
        priority_map = {"Critical": "Critical", "High": "High", "Medium": "Medium", "Low": "Low"}
        priority = priority_map.get(u_level, "Medium")
        fb_status = "In Review" if item.get("intent") in ["complaint", "bug_report"] else "New"
        suggested = (item.get("feature_requests") or [""])[0] or item.get("suggested_action")

        fb_doc = {
            "workspace_id": workspace_id,
            "feedback_id": f_id,
            "dataset_id": dataset_id,
            "text": text or f"Customer feedback signal {f_id}",
            "source": src,
            "sentiment": s_norm,
            "sentiment_score": s_score,
            "category": cat.title(),
            "priority": priority,
            "status": fb_status,
            "assigned_to": "Unassigned",
            "user_id": item.get("user_id") or f"user_{f_id.lower()}",
            "device": item.get("source_platform") or "Mobile",
            "app_version": item.get("app_version") or "v2.3.1",
            "date_str": date_str,
            "key_issues": item.get("issues") or item.get("pain_points") or [],
            "suggested_feature": suggested,
            "topics": item.get("keywords") or [],
            "created_at": now,
        }
        feedback_ops.append(
            UpdateOne(
                {"workspace_id": workspace_id, "feedback_id": f_id},
                {"$set": fb_doc},
                upsert=True,
            )
        )

    saved_count = analysis_repository.save_batch_analyses(docs)

    if feedback_ops:
        try:
            customer_feedback_collection.bulk_write(feedback_ops, ordered=False)
        except Exception as e:
            logger.warning(f"Failed to bulk sync into customer_feedback_collection: {e}")

    return saved_count


save_batch_feedback_analysis_tool = crewai_tool("save_batch_feedback_analysis")(save_batch_feedback_analysis)



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

