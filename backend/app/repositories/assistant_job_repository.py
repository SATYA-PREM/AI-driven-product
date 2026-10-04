"""
assistant_job_repository.py
---------------------------
Repository for managing asynchronous assistant query jobs.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId

from app.core.database import assistant_jobs_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


class AssistantJobRepository:
    """Manages async assistant job lifecycle in MongoDB."""

    def create_job(
        self,
        workspace_id: str,
        question: str,
        user_id: Optional[str] = None,
        category_id: Optional[str] = None,
        mode: str = "DYNAMIC_ANALYSIS",
    ) -> Dict[str, Any]:
        """Create a new assistant job record."""
        job_id = f"AST-JOB-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc)
        doc = {
            "job_id": job_id,
            "workspace_id": workspace_id,
            "user_id": user_id,
            "category_id": category_id or "all",
            "question": question,
            "status": "PENDING",
            "stage": "UNDERSTANDING_QUESTION",
            "progress": 15,
            "mode": mode,
            "result": None,
            "error": None,
            "created_at": now,
            "updated_at": now,
        }
        assistant_jobs_collection.insert_one(doc)
        return doc

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve job status by job_id."""
        doc = assistant_jobs_collection.find_one({"job_id": job_id})
        if doc:
            doc.pop("_id", None)
            return doc
        return None

    def update_job_progress(
        self,
        job_id: str,
        stage: str,
        progress: int,
        status: str = "RUNNING"
    ) -> None:
        """Update job stage and progress percentage."""
        assistant_jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "stage": stage,
                    "progress": progress,
                    "status": status,
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )

    def complete_job(self, job_id: str, result: Dict[str, Any]) -> None:
        """Mark job completed with result payload."""
        assistant_jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": "COMPLETED",
                    "stage": "COMPLETED",
                    "progress": 100,
                    "result": result,
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )

    def fail_job(self, job_id: str, error_message: str) -> None:
        """Mark job failed."""
        assistant_jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": "FAILED",
                    "stage": "FAILED",
                    "error": error_message,
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )


assistant_job_repository = AssistantJobRepository()

