from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.constants import JobStep, JobStatus

class ProcessingJobModel:
    """Model for processing job collection."""

    @staticmethod
    def create_document(
        dataset_id: str,
        workspace_id: str,
        job_type: str = "full_pipeline",
        current_step: JobStep = JobStep.INGESTION,
        status: JobStatus = JobStatus.QUEUED,
        progress: float = 0.0,
        step_results: Optional[Dict[str, Any]] = None,
        error: str = "",
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        retry_count: int = 0
    ) -> Dict[str, Any]:
        """Create a new processing job document for MongoDB."""
        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "job_type": job_type,
            "current_step": current_step,
            "status": status,
            "progress": progress,
            "step_results": step_results or {},
            "error": error,
            "started_at": started_at,
            "completed_at": completed_at,
            "retry_count": retry_count,
            "created_at": datetime.now(timezone.utc)
        }
