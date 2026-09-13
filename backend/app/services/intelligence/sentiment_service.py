"""
sentiment_service.py
--------------------
Service for aggregating customer sentiment distributions across datasets.
"""

from __future__ import annotations

from app.repositories.analysis_repository import analysis_repository


class SentimentService:
    """Service to aggregate sentiment metrics."""

    @staticmethod
    def get_sentiment_breakdown(dataset_id: str | None = None, workspace_id: str = "") -> dict:
        """Calculate counts and percentages for each sentiment category across dataset or workspace."""
        counts = analysis_repository.get_sentiment_distribution(dataset_id=dataset_id, workspace_id=workspace_id or None)
        total = sum(counts.values())

        percentages = {}
        for sentiment, count in counts.items():
            percentages[sentiment] = round((count / total) * 100.0, 1) if total > 0 else 0.0

        return {
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "total_count": total,
            "distribution": counts,
            "percentages": percentages,
        }


sentiment_service = SentimentService()

