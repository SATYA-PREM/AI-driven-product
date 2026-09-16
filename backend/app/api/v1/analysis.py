"""
analysis.py
-----------
FastAPI routes for triggering AI analysis jobs, checking job status,
and retrieving individual record analyses.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from app.middleware.auth_middleware import get_current_user
from app.core.exceptions import NotFoundError
from app.repositories.dataset_repository import dataset_repository
from app.repositories.analysis_repository import ai_job_repository, analysis_repository
from app.workflow.states import WorkflowState
from app.workflow.transitions import require_dataset_stage
from app.workflow.orchestrator import ai_orchestrator
from app.schemas.analysis import AnalysisStartRequest
from app.schemas.job import AIJobResponse
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(
    prefix="",
    tags=["6. AI Analysis Pipeline (CrewAI 3-Agent Flow)"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/datasets/{dataset_id}/analysis",
    response_model=dict,
    summary="Trigger 3-Agent AI Pipeline on Complete Dataset",
    description="""
**Launches the sequential 3-Agent AI Workflow across ALL records in the dataset:**
1. **Agent 1 (Feedback Analysis Agent)**: Analyzes EVERY customer feedback record in the dataset across 10 dimensions (Sentiment, Intent, Theme, Product Area, Issues, Features, Confidences).
2. **Agent 2 (Pattern & Trend Agent)**: Discovers cross-customer issue clusters, feature demand patterns, and period-over-period trend velocity across the entire dataset.
3. **Agent 3 (Product Intelligence Agent)**: Synthesizes findings, computes deterministic 0–100 priority scores, and generates actionable PM insights.

Execution proceeds in a background thread via native CrewAI sequential orchestration. Returns immediately with the created `job_id`.
""",
)
def start_dataset_analysis(
    dataset_id: str,
    payload: AnalysisStartRequest = AnalysisStartRequest(),
    current_user=Depends(get_current_user),
):
    """
    Start the 3-agent Milestone 2 AI pipeline on an AI-ready dataset.
    Requires dataset to be in PREPROCESSED stage (no stage-jumping allowed).
    Returns immediately with job_id and QUEUED status.
    """
    dataset = dataset_repository.find_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)

    workspace_id = str(dataset.get("workspace_id", ""))
    user_id = str(current_user.get("_id") or current_user.get("id") or "")
    current_status = str(dataset.get("status", "")).upper()

    # If a job is currently running and not force rerun, return the active job
    if not payload.force_rerun:
        active_job = ai_job_repository.collection.find_one({
            "dataset_id": dataset_id,
            "status": {"$in": ["RUNNING", "QUEUED", "running", "queued"]}
        })
        if active_job:
            return {
                "job_id": active_job.get("job_id", ""),
                "dataset_id": dataset_id,
                "workspace_id": workspace_id,
                "status": active_job.get("status", "RUNNING"),
                "message": "AI Analysis is already actively in progress for this dataset.",
                "already_running": True,
                "analysis_version": payload.analysis_version,
                "pipeline": [
                    "Agent 1: Feedback Analysis Agent",
                    "Agent 2: Pattern & Trend Agent",
                    "Agent 3: Product Intelligence Agent",
                ],
            }

    # If not force rerun and already completed with existing records, return early with status
    existing_analyses_count = analysis_repository.count_by_dataset(dataset_id)
    if not payload.force_rerun and existing_analyses_count > 0 and current_status in [WorkflowState.COMPLETED.value, WorkflowState.INTELLIGENCE_READY.value, "COMPLETED", "INTELLIGENCE_READY"]:
        latest_jobs = ai_job_repository.find_many({"dataset_id": dataset_id}, limit=1)
        latest_job = latest_jobs[0] if latest_jobs else {}
        return {
            "job_id": latest_job.get("job_id", f"JOB-{dataset_id[:8]}"),
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "status": "ALREADY_COMPLETED",
            "message": "AI Analysis is already completed for this dataset. Use 'Re-run AI Pipeline' to re-analyze.",
            "already_completed": True,
            "total_analyzed_records": existing_analyses_count,
            "analysis_version": payload.analysis_version,
            "pipeline": [
                "Agent 1: Feedback Analysis Agent (Completed)",
                "Agent 2: Pattern & Trend Agent (Completed)",
                "Agent 3: Product Intelligence Agent (Completed)",
            ],
        }

    # If dataset is not yet in an AI-ready state, auto-complete prerequisite stages seamlessly
    ai_ready_states = [WorkflowState.PREPROCESSED.value, WorkflowState.COMPLETED.value, WorkflowState.FAILED.value, "READY", "PROCESSED"]
    if current_status not in ai_ready_states:
        if current_status in [WorkflowState.CLEANED.value, "CLEANED"]:
            from app.services.preprocessing.preprocessing_service import preprocessing_service
            preprocessing_service.preprocess_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
        else:
            from app.agents.data_agent.agent import data_agent
            data_agent.run_full_pipeline(dataset_id=dataset_id, workspace_id=workspace_id)
        
        # Refresh dataset status from DB
        dataset = dataset_repository.find_by_id(dataset_id) or dataset

    # Enforce stage verification
    require_dataset_stage(
        dataset=dataset,
        required_states=[WorkflowState.PREPROCESSED, WorkflowState.COMPLETED, WorkflowState.FAILED, WorkflowState.CLEANED],
        operation_name="AI Analysis (CrewAI 3 Agents)",
    )

    job_id = ai_orchestrator.trigger_pipeline_async(
        dataset_id=dataset_id,
        workspace_id=workspace_id,
        analysis_version=payload.analysis_version,
    )

    return {
        "job_id": job_id,
        "dataset_id": dataset_id,
        "workspace_id": workspace_id,
        "status": "QUEUED",
        "analysis_version": payload.analysis_version,
        "pipeline": [
            "Agent 1: Feedback Analysis Agent",
            "Agent 2: Pattern & Trend Agent",
            "Agent 3: Product Intelligence Agent",
        ],
    }


@router.get(
    "/analysis/jobs/{job_id}",
    response_model=AIJobResponse,
    summary="Get AI Job status and per-agent progress",
    description="Polls real-time progress for an AI job, showing which agent is currently active ('feedback_analysis' | 'pattern_trend' | 'product_intelligence') and their individual statuses.",
)
def get_ai_job_status(
    job_id: str,
    current_user=Depends(get_current_user),
):
    """Check status and progress of an AI job."""
    job = ai_job_repository.get_job_with_full_output(job_id)
    if not job:
        job = ai_job_repository.get_by_job_id(job_id)
    if not job:
        # Also check by string ID if needed
        job = ai_job_repository.find_by_id(job_id)
        if not job:
            raise NotFoundError("AIJob", job_id)

    return serialize_document(job)


@router.post(
    "/analysis/jobs/{job_id}/retry",
    response_model=dict,
    summary="Retry a specific failed agent stage",
    description="Re-executes a failed agent stage ('feedback_analysis', 'pattern_trend', or 'product_intelligence') without having to rerun the entire pipeline from scratch.",
)
def retry_agent_stage(
    job_id: str,
    stage_name: str = Query(..., description="Agent stage to retry: 'pattern_trend' or 'product_intelligence'"),
    current_user=Depends(get_current_user),
):
    """Retry an individual failed stage in an AI job."""
    result = ai_orchestrator.retry_stage(job_id=job_id, stage_name=stage_name)
    return {"job_id": job_id, "retried_stage": stage_name, "result": result}


@router.get(
    "/datasets/{dataset_id}/analyses",
    response_model=dict,
    summary="Get Complete Dataset AI Analyses (All Analyzed Feedback Records)",
    description="Retrieve all 10-dimension customer feedback analyses generated for the complete dataset. Supports limit=0 (default) to retrieve all records without truncation.",
)
def get_dataset_analyses(
    dataset_id: str,
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(0, ge=0, description="Max records to return (0 = all records in dataset)"),
    current_user=Depends(get_current_user),
):
    """Retrieve all feedback analyses for the complete dataset with enriched text and dimensions."""
    total = analysis_repository.count_by_dataset(dataset_id)
    analyses = analysis_repository.get_by_dataset_id(dataset_id, skip=skip, limit=limit)
    sentiment_dist = analysis_repository.get_sentiment_distribution(dataset_id)

    # Build fallback lookup from raw/processed records
    raw_lookup: dict[str, str] = {}
    try:
        from app.repositories.data_repository import data_repository
        processed_records = data_repository.get_processed_records(dataset_id, limit=0)
        for r in processed_records:
            fid = str(r.get("source_id") or r.get("feedback_id") or r.get("id") or r.get("_id") or "")
            txt = str(r.get("text") or r.get("feedback_text") or r.get("feedback") or "").strip()
            if fid and txt:
                raw_lookup[fid] = txt
        if not raw_lookup:
            raw_records = data_repository.get_raw_records(dataset_id, limit=0)
            for r in raw_records:
                orig = r.get("original_record") or {}
                fid = str(r.get("feedback_id") or r.get("source_record_id") or r.get("id") or orig.get("feedback_id") or orig.get("customer_id") or "")
                txt = str(r.get("text") or r.get("feedback_text") or r.get("feedback") or orig.get("feedback_text") or orig.get("text") or orig.get("feedback") or orig.get("content") or "").strip()
                if fid and txt:
                    raw_lookup[fid] = txt
    except Exception as e:
        from app.core.logging import get_logger
        get_logger(__name__).debug(f"Lookup enrichment notice: {e}")

    enriched_analyses = []
    for doc in analyses:
        analysis_data = doc.get("analysis") or {}
        fid = str(doc.get("feedback_id") or "")

        fb_text = (
            doc.get("feedback_text")
            or doc.get("text")
            or analysis_data.get("feedback_text")
            or analysis_data.get("text")
            or raw_lookup.get(fid)
            or ""
        )

        item = {
            **doc,
            "feedback_id": fid,
            "feedback_text": fb_text,
            "text": fb_text,
            "sentiment": str(doc.get("sentiment") or analysis_data.get("sentiment") or "NEUTRAL").upper(),
            "sentiment_confidence": float(analysis_data.get("sentiment_confidence") or doc.get("confidence") or 0.90),
            "intent": str(doc.get("intent") or analysis_data.get("intent") or "Feedback"),
            "intent_confidence": float(analysis_data.get("intent_confidence") or 0.90),
            "theme": str(doc.get("theme") or analysis_data.get("theme") or "General"),
            "product_area": str(doc.get("product_area") or analysis_data.get("product_area") or analysis_data.get("theme") or "Core"),
            "pain_points": analysis_data.get("pain_points") or doc.get("pain_points") or [],
            "issues": analysis_data.get("issues") or doc.get("issues") or [],
            "feature_requests": analysis_data.get("feature_requests") or doc.get("feature_requests") or [],
            "keywords": analysis_data.get("keywords") or doc.get("keywords") or [],
            "confidence": float(doc.get("confidence") or analysis_data.get("overall_confidence") or 0.90),
        }
        enriched_analyses.append(item)

    return {
        "dataset_id": dataset_id,
        "total_records": total,
        "returned_records": len(enriched_analyses),
        "sentiment_distribution": sentiment_dist,
        "analyses": serialize_documents(enriched_analyses),
    }


@router.get(
    "/analysis/{record_id}",
    response_model=dict,
    summary="Get 10-dimension AI Analysis for a single feedback record by ID",
    description="Retrieve the validated Agent 1 output for a specific feedback record (Sentiment, Intent, Theme, Product Area, Issues, Pain Points, Features, Confidences) by its feedback_id or source record identifier.",
)
def get_record_analysis(
    record_id: str,
    dataset_id: str | None = Query(None, description="Optional dataset filter"),
    current_user=Depends(get_current_user),
):
    """Retrieve the AI analysis for an individual customer feedback record."""
    analysis = analysis_repository.get_by_feedback_id(record_id, dataset_id=dataset_id)
    if not analysis:
        try:
            from bson import ObjectId
            if ObjectId.is_valid(record_id):
                analysis = analysis_repository.collection.find_one({"_id": ObjectId(record_id)})
            if not analysis:
                analysis = analysis_repository.collection.find_one({"analysis_id": record_id})
        except Exception:
            pass

    if not analysis:
        raise NotFoundError("AnalysisRecord", record_id)

    analysis_data = analysis.get("analysis") or {}
    fb_text = (
        analysis.get("feedback_text")
        or analysis.get("text")
        or analysis_data.get("feedback_text")
        or analysis_data.get("text")
        or ""
    )
    if not fb_text and analysis.get("dataset_id"):
        from app.repositories.data_repository import data_repository
        raw = data_repository.get_raw_records(analysis["dataset_id"], limit=200)
        for r in raw:
            orig = r.get("original_record") or {}
            if r.get("feedback_id") == analysis.get("feedback_id") or r.get("id") == analysis.get("feedback_id"):
                fb_text = r.get("text") or r.get("feedback_text") or orig.get("text") or orig.get("feedback_text") or ""
                break

    item = {
        **analysis,
        "feedback_text": fb_text,
        "text": fb_text,
        "sentiment": str(analysis.get("sentiment") or analysis_data.get("sentiment") or "NEUTRAL").upper(),
        "intent": str(analysis.get("intent") or analysis_data.get("intent") or "Feedback"),
        "theme": str(analysis.get("theme") or analysis_data.get("theme") or "General"),
        "product_area": str(analysis.get("product_area") or analysis_data.get("product_area") or "Core"),
        "pain_points": analysis_data.get("pain_points") or analysis.get("pain_points") or [],
        "issues": analysis_data.get("issues") or analysis.get("issues") or [],
        "feature_requests": analysis_data.get("feature_requests") or analysis.get("feature_requests") or [],
        "keywords": analysis_data.get("keywords") or analysis.get("keywords") or [],
        "confidence": float(analysis.get("confidence") or analysis_data.get("overall_confidence") or 0.90),
    }

    return serialize_document(item)

