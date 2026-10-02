"""
prd_assignment_job_repository.py
--------------------------------
MongoDB repository for Asynchronous PRD Assignment Analysis Jobs and AI Recommendations.
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional
from datetime import datetime, timezone

from app.repositories.base_repository import BaseRepository
from app.core.database import (
    prd_assignment_jobs_collection,
    prd_assignment_recommendations_collection,
)
from app.core.constants import JobStatus, AssignmentJobStage


class PRDAssignmentJobRepository(BaseRepository):

    def __init__(self):
        super().__init__(prd_assignment_jobs_collection)

    def create_job(self, job_doc: dict[str, Any]) -> str:
        res = prd_assignment_jobs_collection.insert_one(job_doc)
        return job_doc.get("job_id", str(res.inserted_id))

    def get_job(self, job_id: str) -> Optional[dict[str, Any]]:
        return prd_assignment_jobs_collection.find_one({"job_id": job_id})

    def update_job_progress(
        self,
        job_id: str,
        stage: AssignmentJobStage | str,
        progress: int,
        processed_requirements: int,
        total_requirements: Optional[int] = None,
        status: Optional[JobStatus | str] = None,
        error: Optional[str] = None,
    ) -> None:
        stage_val = stage.value if hasattr(stage, "value") else str(stage)
        update_data: dict[str, Any] = {
            "stage": stage_val,
            "progress": min(max(int(progress), 0), 100),
            "processed_requirements": processed_requirements,
        }
        if total_requirements is not None:
            update_data["total_requirements"] = total_requirements
        if status:
            status_val = status.value if hasattr(status, "value") else str(status)
            update_data["status"] = status_val
            if status_val in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]:
                update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        if error:
            update_data["error"] = str(error)

        prd_assignment_jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )

    def save_recommendation(self, rec_doc: dict[str, Any]) -> str:
        req_id = rec_doc["requirement_id"]
        job_id = rec_doc["job_id"]
        
        # Upsert recommendation
        existing = prd_assignment_recommendations_collection.find_one({
            "job_id": job_id,
            "requirement_id": req_id
        })
        if existing:
            rec_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            prd_assignment_recommendations_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {k: v for k, v in rec_doc.items() if k != "_id"}}
            )
            return existing.get("recommendation_id", str(existing["_id"]))

        res = prd_assignment_recommendations_collection.insert_one(rec_doc)
        return rec_doc.get("recommendation_id", str(res.inserted_id))

    def get_recommendations_by_job(self, job_id: str) -> List[dict[str, Any]]:
        return list(prd_assignment_recommendations_collection.find({"job_id": job_id}).sort("created_at", -1))

    def get_recommendations_by_prd(self, prd_id: str) -> List[dict[str, Any]]:
        return list(prd_assignment_recommendations_collection.find({"prd_id": prd_id}).sort("created_at", -1))

    def get_recommendation_by_id(self, recommendation_id: str) -> Optional[dict[str, Any]]:
        return prd_assignment_recommendations_collection.find_one({"recommendation_id": recommendation_id})

    def update_recommendation_status(self, recommendation_id: str, status: str) -> bool:
        res = prd_assignment_recommendations_collection.update_one(
            {"recommendation_id": recommendation_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return res.matched_count > 0


prd_assignment_job_repository = PRDAssignmentJobRepository()

