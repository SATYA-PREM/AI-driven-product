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
    """Retrieve all feedback analyses for the complete dataset."""
    total = analysis_repository.count_by_dataset(dataset_id)
    analyses = analysis_repository.get_by_dataset_id(dataset_id, skip=skip, limit=limit)
    sentiment_dist = analysis_repository.get_sentiment_distribution(dataset_id)
    return {
        "dataset_id": dataset_id,
        "total_records": total,
        "returned_records": len(analyses),
        "sentiment_distribution": sentiment_dist,
        "analyses": serialize_documents(analyses),
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
        raise NotFoundError("AnalysisRecord", record_id)

    return serialize_document(analysis)

