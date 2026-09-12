"""
analysis_service.py
-------------------
Service coordinating individual feedback analyses on AI-ready datasets.
"""

from __future__ import annotations

from typing import Any
from app.repositories.data_repository import data_repository
from app.repositories.analysis_repository import analysis_repository
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalysisService:
    """Service to coordinate record analyses and queries."""

    @staticmethod
    def get_analysis_for_record(feedback_id: str, dataset_id: str | None = None) -> dict[str, Any] | None:
        """Fetch analysis document for a single record."""
        return analysis_repository.get_by_feedback_id(feedback_id, dataset_id)

    @staticmethod
    def get_dataset_analyses(dataset_id: str, skip: int = 0, limit: int = 100) -> list[dict[str, Any]]:
        """Fetch analyses for a dataset."""
        return analysis_repository.get_by_dataset_id(dataset_id, skip=skip, limit=limit)


analysis_service = AnalysisService()

