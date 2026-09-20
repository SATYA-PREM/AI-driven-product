"""
analysis_repository.py
----------------------
Repository for individual feedback analyses and AI jobs.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
from pymongo import UpdateOne

from app.core.database import analyses_collection, ai_jobs_collection, issue_clusters_collection, feature_clusters_collection, product_insights_collection
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
        dataset_id = str(analysis_doc.get("dataset_id", ""))
        feedback_id = str(analysis_doc.get("feedback_id", ""))
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

    def save_batch_analyses(self, analyses: list[dict[str, Any]]) -> int:
        """Bulk upsert multiple feedback analyses."""
        if not analyses:
            return 0
        operations = []
        for doc in analyses:
            d_id = str(doc.get("dataset_id", ""))
            f_id = str(doc.get("feedback_id", ""))
            operations.append(
                UpdateOne(
                    {"dataset_id": d_id, "feedback_id": f_id},
                    {"$set": doc},
                    upsert=True,
                )
            )
        try:
            result = self.collection.bulk_write(operations, ordered=False)
            return (result.upserted_count or 0) + (result.modified_count or 0) + (result.matched_count or 0)
        except Exception as e:
            logger.warning(f"Bulk write failed, falling back to sequential: {e}")
            count = 0
            for doc in analyses:
                self.save_analysis(doc)
                count += 1
            return count

    def delete_by_dataset_id(self, dataset_id: str) -> int:
        """Delete all analyses for a given dataset."""
        try:
            result = self.collection.delete_many({"dataset_id": dataset_id})
            return result.deleted_count
        except Exception:
            keys_to_del = [k for k, v in self._memory_store.items() if v.get("dataset_id") == dataset_id]
            for k in keys_to_del:
                del self._memory_store[k]
            return len(keys_to_del)

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

    def count_by_workspace(self, workspace_id: str) -> int:
        """Count total feedback analyses for a given workspace."""
        try:
            return self.collection.count_documents({"workspace_id": workspace_id})
        except Exception:
            return sum(1 for doc in self._memory_store.values() if doc.get("workspace_id") == workspace_id)

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

    def get_sentiment_distribution(
        self, dataset_id: str | list[str] | None = None, workspace_id: str | None = None
    ) -> dict[str, int]:
        """Aggregate sentiment distribution for a dataset, list of datasets, or entire workspace."""
        counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
        query: dict[str, Any] = {}
        if dataset_id:
            if isinstance(dataset_id, list):
                query["dataset_id"] = {"$in": dataset_id} if len(dataset_id) > 1 else dataset_id[0]
            else:
                query["dataset_id"] = dataset_id
        if workspace_id:
            query["workspace_id"] = workspace_id

        if not query:
            return counts

        try:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": "$analysis.sentiment", "count": {"$sum": 1}}},
            ]
            result = list(self.collection.aggregate(pipeline))
            for item in result:
                sentiment = item.get("_id")
                if sentiment in counts:
                    counts[sentiment] = item.get("count", 0)
        except Exception:
            ds_list = [dataset_id] if isinstance(dataset_id, str) else dataset_id
            for doc in self._memory_store.values():
                match = True
                if ds_list and doc.get("dataset_id") not in ds_list:
                    match = False
                if workspace_id and doc.get("workspace_id") != workspace_id:
                    match = False
                if match:
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

    def update_stage_output(
        self,
        job_id: str,
        stage_name: str,
        output_data: dict[str, Any],
    ) -> bool:
        """Update and map stage outputs directly onto the job document."""
        update_data: dict[str, Any] = {
            f"stage_outputs.{stage_name}": output_data,
            "updated_at": datetime.now(timezone.utc),
        }
        try:
            result = self.collection.update_one({"job_id": job_id}, {"$set": update_data})
            return result.matched_count > 0
        except Exception:
            if job_id in self._memory_store:
                self._memory_store[job_id].setdefault("stage_outputs", {})[stage_name] = output_data
                return True
            return False

    def update_job_status(
        self,
        job_id: str,
        status: str,
        error: str | None = None,
        summary: dict[str, Any] | None = None,
    ) -> bool:
        """Update overall job status and optional summary."""
        update_data: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now(timezone.utc),
        }
        if error is not None:
            update_data["error"] = error
        if summary is not None:
            update_data["summary"] = summary
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
                if summary:
                    job["summary"] = summary
                return True
            return False

    def get_job_with_full_output(self, job_id: str) -> dict[str, Any] | None:
        """
        Get complete AI Job document hydrated with mapped stage outputs:
        - Stage 1: Feedbacks & sentiment metrics
        - Stage 2: Issue clusters and feature trends
        - Stage 3: Product intelligence and priority recommendations
        """
        job = self.get_by_job_id(job_id)
        if not job:
            return None

        dataset_id = job.get("dataset_id")
        workspace_id = job.get("workspace_id")

        stage_outputs = job.get("stage_outputs", {})

        # Ensure Stage 1 has sentiment & analysis counts
        if "stage_1" not in stage_outputs and dataset_id:
            sentiment_dist = analysis_repository.get_sentiment_distribution(dataset_id=dataset_id)
            total_analyses = analysis_repository.count_by_dataset(dataset_id)
            stage_outputs["stage_1"] = {
                "total_analyzed": total_analyses,
                "sentiment_distribution": sentiment_dist,
            }

        # Ensure Stage 2 has pattern clusters
        if "stage_2" not in stage_outputs and dataset_id:
            try:
                issues = list(issue_clusters_collection.find({"dataset_id": dataset_id}))
                features = list(feature_clusters_collection.find({"dataset_id": dataset_id}))
                if issues or features:
                    stage_outputs["stage_2"] = {
                        "issue_clusters_count": len(issues),
                        "feature_clusters_count": len(features),
                        "issue_clusters": issues,
                        "feature_clusters": features,
                    }
            except Exception:
                pass

        # Ensure Stage 3 has product intelligence
        if "stage_3" not in stage_outputs and dataset_id:
            try:
                insights_docs = list(product_insights_collection.find({"dataset_id": dataset_id}))
                if insights_docs:
                    stage_outputs["stage_3"] = {
                        "insights_count": len(insights_docs),
                        "insights": insights_docs,
                    }
            except Exception:
                pass

        job["stage_outputs"] = stage_outputs
        return job


# Module-level singletons
analysis_repository = AnalysisRepository()
ai_job_repository = AIJobRepository()
