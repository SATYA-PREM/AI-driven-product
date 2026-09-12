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
from app.agents.orchestrator import ai_orchestrator
from app.schemas.analysis import AnalysisStartRequest
from app.schemas.job import AIJobResponse
from app.utils.serialization import serialize_document

router = APIRouter(prefix="", tags=["AI Analysis"], dependencies=[Depends(get_current_user)])


@router.post("/datasets/{dataset_id}/analysis", response_model=dict)
def start_dataset_analysis(
    dataset_id: str,
    payload: AnalysisStartRequest = AnalysisStartRequest(),
    current_user=Depends(get_current_user),
):
    """
    Start the 3-agent Milestone 2 AI pipeline on an AI-ready dataset.
    Returns immediately with job_id and QUEUED status.
    """
    dataset = dataset_repository.find_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)

    workspace_id = str(dataset.get("workspace_id", ""))

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
    }


@router.get("/analysis/jobs/{job_id}", response_model=AIJobResponse)
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


@router.get("/analysis/{record_id}", response_model=dict)
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

