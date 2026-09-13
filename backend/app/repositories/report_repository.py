"""
report_repository.py
--------------------
Repository for storing and retrieving executive product intelligence reports.
Includes in-memory fallback for offline or testing environments.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
from app.core.database import reports_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


class ReportRepository:
    """Repository handling persistence and queries for executive PM reports."""

    def __init__(self):
        self._memory_reports: dict[str, dict[str, Any]] = {}

    def save_report(self, report_doc: dict[str, Any]) -> str:
        """Persist or update an executive report."""
        report_id = report_doc.get("report_id", "")
        doc = dict(report_doc)
        doc.pop("_id", None)
        if "created_at" not in doc or doc["created_at"] is None:
            doc["created_at"] = doc.get("generated_at") or datetime.now(timezone.utc)
        try:
            reports_collection.update_one(
                {"report_id": report_id},
                {"$set": doc},
                upsert=True,
            )
            return report_id
        except Exception as e:
            logger.debug(f"MongoDB write fallback to in-memory for report {report_id}: {e}")
            self._memory_reports[report_id] = doc
            return report_id

    def get_by_report_id(self, report_id: str) -> dict[str, Any] | None:
        """Find a report by its unique ID."""
        try:
            return reports_collection.find_one({"report_id": report_id})
        except Exception:
            return self._memory_reports.get(report_id)

    def get_latest_report(
        self, workspace_id: str, dataset_id: str | None = None
    ) -> dict[str, Any] | None:
        """Retrieve the most recently created report for a workspace/dataset."""
        query: dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            query["dataset_id"] = dataset_id

        try:
            cursor = reports_collection.find(query).sort([("created_at", -1), ("generated_at", -1), ("_id", -1)]).limit(1)
            results = list(cursor)
            if results:
                return results[0]
        except Exception:
            matching = [
                r for r in self._memory_reports.values()
                if r.get("workspace_id") == workspace_id and (not dataset_id or r.get("dataset_id") == dataset_id)
            ]
            if matching:
                return matching[-1]

        # If no report found with specific dataset_id, fallback to workspace-level report
        if dataset_id:
            try:
                cursor = reports_collection.find({"workspace_id": workspace_id}).sort("created_at", -1).limit(1)
                results = list(cursor)
                if results:
                    return results[0]
            except Exception:
                pass
        return None

    def list_reports(
        self, workspace_id: str, dataset_id: str | None = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """List reports for a workspace."""
        query: dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            query["dataset_id"] = dataset_id

        try:
            return list(reports_collection.find(query).sort("created_at", -1).limit(limit))
        except Exception:
            items = [
                r for r in self._memory_reports.values()
                if r.get("workspace_id") == workspace_id and (not dataset_id or r.get("dataset_id") == dataset_id)
            ]
            return items[:limit]


report_repository = ReportRepository()

