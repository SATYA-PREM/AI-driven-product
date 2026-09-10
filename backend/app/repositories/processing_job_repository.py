from datetime import datetime, timezone
from app.repositories.base_repository import BaseRepository
from app.core.database import processing_jobs_collection
from bson import ObjectId

class ProcessingJobRepository(BaseRepository):
    """Repository for processing job operations."""

    def __init__(self):
        super().__init__(processing_jobs_collection)

    def find_by_dataset(self, dataset_id: str) -> list[dict]:
        """Find all processing jobs for a dataset."""
        return self.find_many({"dataset_id": dataset_id})

    def find_latest_by_dataset(self, dataset_id: str) -> dict | None:
        """Find the most recent processing job for a dataset."""
        results = self.find_many(
            filter={"dataset_id": dataset_id},
            limit=1,
            sort=[("created_at", -1)]
        )
        return results[0] if results else None

    def update_step(self, job_id: str, step: str, status: str, progress: float, step_result: dict = None) -> bool:
        """Update a specific step in the job."""
        if not ObjectId.is_valid(job_id):
            return False
        
        if step_result is None:
            step_result = {}
            
        update_data = {
            f"steps.{step}.status": status,
            f"steps.{step}.progress": progress,
            f"steps.{step}.result": step_result,
            f"steps.{step}.updated_at": datetime.now(timezone.utc)
        }
        
        result = self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )
        return result.matched_count > 0

    def update_status(self, job_id: str, status: str, error: str = '') -> bool:
        """Update the overall status of the job."""
        update_data = {"status": status, "updated_at": datetime.now(timezone.utc)}
        if error:
            update_data["error"] = error
            
        return self.update(job_id, update_data)

    def mark_completed(self, job_id: str) -> bool:
        """Mark a job as fully completed."""
        update_data = {
            "status": "COMPLETED",
            "progress": 100.0,
            "completed_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        return self.update(job_id, update_data)

    def mark_failed(self, job_id: str, error: str) -> bool:
        """Mark a job as failed."""
        update_data = {
            "status": "FAILED",
            "error": error,
            "completed_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        return self.update(job_id, update_data)

processing_job_repository = ProcessingJobRepository()
