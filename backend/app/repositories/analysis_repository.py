"""
analysis_repository.py
----------------------
Repository for individual feedback analyses and AI jobs.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime, timezone

from app.core.database import analyses_collection, ai_jobs_collection
from app.repositories.base_repository import BaseRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalysisRepository(BaseRepository):
    """Repository handling CRUD operations for individual feedback analyses."""

    def __init__(self):
        super().__init__(analyses_collection)
        self._memory_store: dict[str, dict[str, Any]] = {}

    def save_analysis(self, analysis_doc: dict[str, Any]) -> str:
        """
        Upsert a feedback analysis document by dataset_id and feedback_id
        to ensure idempotency.
        """
        dataset_id = analysis_doc["dataset_id"]
        feedback_id = analysis_doc["feedback_id"]
        key = f"{dataset_id}:{feedback_id}"

        try:
            result = self.collection.update_one(
                {"dataset_id": dataset_id, "feedback_id": feedback_id},
                {"$set": analysis_doc},
                upsert=True,
            )
            if result.upserted_id:
                return str(result.upserted_id)
            existing = self.collection.find_one({"dataset_id": dataset_id, "feedback_id": feedback_id})
            return str(existing["_id"]) if existing else key
        except Exception as e:
            logger.debug(f"MongoDB write fallback to in-memory: {e}")
            self._memory_store[key] = analysis_doc
            return key

    def get_by_feedback_id(self, feedback_id: str, dataset_id: str | None = None) -> dict[str, Any] | None:
        """Find an analysis by feedback ID and optionally dataset ID."""
        try:
            query: dict[str, Any] = {"feedback_id": feedback_id}
            if dataset_id:
                query["dataset_id"] = dataset_id
            return self.collection.find_one(query)
        except Exception:
            for k, doc in self._memory_store.items():
                if doc.get("feedback_id") == feedback_id:
                    if not dataset_id or doc.get("dataset_id") == dataset_id:
                        return doc
            return None

    def get_by_dataset_id(
        self, dataset_id: str, skip: int = 0, limit: int | None = None
    ) -> list[dict[str, Any]]:
        """Get all feedback analyses for a given dataset. If limit is None or <= 0, returns all."""
        try:
            cursor = self.collection.find({"dataset_id": dataset_id}).skip(skip)
            if limit is not None and limit > 0:
                cursor = cursor.limit(limit)
            return list(cursor)
        except Exception:
            matching = [doc for doc in self._memory_store.values() if doc.get("dataset_id") == dataset_id]
            if limit is not None and limit > 0:
                return matching[skip : skip + limit]
            return matching[skip:]

    def count_by_dataset(self, dataset_id: str) -> int:
        """Count total feedback analyses for a given dataset."""
        try:
            return self.collection.count_documents({"dataset_id": dataset_id})
        except Exception:
            return sum(1 for doc in self._memory_store.values() if doc.get("dataset_id") == dataset_id)

    def get_by_workspace_id(
        self, workspace_id: str, skip: int = 0, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Get feedback analyses for a workspace."""
        try:
            cursor = self.collection.find({"workspace_id": workspace_id}).skip(skip).limit(limit)
            return list(cursor)
        except Exception:
            matching = [doc for doc in self._memory_store.values() if doc.get("workspace_id") == workspace_id]
            return matching[skip : skip + limit]

    def get_sentiment_distribution(self, dataset_id: str) -> dict[str, int]:
        """Aggregate sentiment distribution for a dataset."""
        counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
        try:
            pipeline = [
                {"$match": {"dataset_id": dataset_id}},
                {"$group": {"_id": "$analysis.sentiment", "count": {"$sum": 1}}},
            ]
            result = list(self.collection.aggregate(pipeline))
            for item in result:
                sentiment = item.get("_id")
                if sentiment in counts:
                    counts[sentiment] = item.get("count", 0)
        except Exception:
            for doc in self._memory_store.values():
                if doc.get("dataset_id") == dataset_id:
                    s = doc.get("analysis", {}).get("sentiment")
                    if s in counts:
                        counts[s] += 1
        return counts


class AIJobRepository(BaseRepository):
    """Repository handling CRUD operations for AI jobs."""

    def __init__(self):
        super().__init__(ai_jobs_collection)
        self._memory_store: dict[str, dict[str, Any]] = {}

    def create_job(self, job_doc: dict[str, Any]) -> str:
        """Insert a new AI job document."""
        job_id = job_doc.get("job_id", "")
        try:
            return self.create(job_doc)
        except Exception:
            self._memory_store[job_id] = job_doc
            return job_id

    def get_by_job_id(self, job_id: str) -> dict[str, Any] | None:
        """Find an AI job by its unique business job_id string (e.g. JOB-1001)."""
        try:
            return self.collection.find_one({"job_id": job_id})
        except Exception:
            return self._memory_store.get(job_id)

    def get_latest_by_dataset(self, dataset_id: str) -> dict[str, Any] | None:
        """Find the most recent AI job for a dataset."""
        try:
            return self.collection.find_one(
                {"dataset_id": dataset_id},
                sort=[("created_at", -1)],
            )
        except Exception:
            matching = [j for j in self._memory_store.values() if j.get("dataset_id") == dataset_id]
            return matching[-1] if matching else None

    def update_agent_status(
        self,
        job_id: str,
        agent_name: str,
        status: str,
        current_agent: str | None = None,
    ) -> bool:
        """Update an agent's status inside the job."""
        update_data: dict[str, Any] = {
            f"agents.{agent_name}": status,
            "updated_at": datetime.now(timezone.utc),
        }
        if current_agent is not None:
            update_data["current_agent"] = current_agent

        try:
            result = self.collection.update_one({"job_id": job_id}, {"$set": update_data})
            return result.matched_count > 0
        except Exception:
            if job_id in self._memory_store:
                job = self._memory_store[job_id]
                job.setdefault("agents", {})[agent_name] = status
                if current_agent is not None:
                    job["current_agent"] = current_agent
                return True
            return False

    def update_job_status(
        self,
        job_id: str,
        status: str,
        error: str | None = None,
    ) -> bool:
        """Update overall job status."""
        update_data: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now(timezone.utc),
        }
        if error is not None:
            update_data["error"] = error
        if status in ["COMPLETED", "FAILED"]:
            update_data["completed_at"] = datetime.now(timezone.utc)

        try:
            result = self.collection.update_one({"job_id": job_id}, {"$set": update_data})
            return result.matched_count > 0
        except Exception:
            if job_id in self._memory_store:
                job = self._memory_store[job_id]
                job["status"] = status
                if error:
                    job["error"] = error
                return True
            return False


# Module-level singletons
analysis_repository = AnalysisRepository()
ai_job_repository = AIJobRepository()
