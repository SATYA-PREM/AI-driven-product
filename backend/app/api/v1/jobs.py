from __future__ import annotations
from fastapi import APIRouter, Depends

from app.schemas.job import JobStatusResponse
from app.middleware.auth_middleware import get_current_user
from app.repositories.processing_job_repository import processing_job_repository
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document

router = APIRouter(prefix="/jobs", tags=["Jobs"], dependencies=[Depends(get_current_user)])


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str, current_user=Depends(get_current_user)):
    job = processing_job_repository.get_by_id(job_id)
    if not job:
        raise NotFoundError("ProcessingJob", job_id)
    serialized = serialize_document(job)
    if "id" in serialized and "job_id" not in serialized:
        serialized["job_id"] = serialized["id"]
    return serialized
