"""
intelligence_service.py
-----------------------
Service orchestrating high-level queries for the Product Intelligence dashboard.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime, timezone

from app.repositories.intelligence_repository import intelligence_repository
from app.repositories.analysis_repository import analysis_repository
from app.services.intelligence.sentiment_service import sentiment_service
from app.utils.serialization import serialize_documents


class IntelligenceService:
    """Service providing aggregated dashboard data to FastAPI routes."""

    @staticmethod
    def get_workspace_intelligence_summary(workspace_id: str, dataset_id: str | None = None) -> dict[str, Any]:
        """Fetch high-level KPI cards and top issues/features for the PM dashboard."""
        issue_clusters = intelligence_repository.get_issue_clusters(workspace_id, dataset_id, limit=5)
        feature_clusters = intelligence_repository.get_feature_clusters(workspace_id, dataset_id, limit=5)
        trends = intelligence_repository.get_trends(workspace_id, dataset_id, limit=5)
        insights = intelligence_repository.get_product_insights(workspace_id, dataset_id, limit=10)

        # Count types
        high_priority_count = 0
        emerging_count = 0
        opportunity_count = 0

        for ins in insights:
            itype = ins.get("insight_type")
            if itype == "HIGH_PRIORITY_ISSUE":
                high_priority_count += 1
            elif itype == "EMERGING_ISSUE":
                emerging_count += 1
            elif itype in ["PRODUCT_OPPORTUNITY", "HIGH_DEMAND_FEATURE"]:
                opportunity_count += 1

        total_analyzed = analysis_repository.count_by_dataset(dataset_id) if dataset_id else len(insights)

        return {
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "summary": {
                "total_insights": len(insights),
                "high_priority_issues": high_priority_count,
                "emerging_issues": emerging_count,
                "high_demand_features": opportunity_count,
                "total_feedback_analyzed": total_analyzed,
            },
            "top_issues": serialize_documents(issue_clusters),
            "top_features": serialize_documents(feature_clusters),
            "trends": serialize_documents(trends),
            "insights": serialize_documents(insights),
            "created_at": datetime.now(timezone.utc),
        }

    @staticmethod
    def get_issues(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        return serialize_documents(intelligence_repository.get_issue_clusters(workspace_id, dataset_id, limit))

    @staticmethod
    def get_features(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        return serialize_documents(intelligence_repository.get_feature_clusters(workspace_id, dataset_id, limit))

    @staticmethod
    def get_trends(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        return serialize_documents(intelligence_repository.get_trends(workspace_id, dataset_id, limit))

    @staticmethod
    def get_sentiment(workspace_id: str, dataset_id: str | None = None) -> dict[str, Any]:
        if not dataset_id:
            # Fallback if no dataset specified
            return {
                "workspace_id": workspace_id,
                "dataset_id": None,
                "total_count": 0,
                "distribution": {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0},
                "percentages": {"positive": 0.0, "negative": 0.0, "neutral": 0.0, "mixed": 0.0},
            }
        return sentiment_service.get_sentiment_breakdown(dataset_id, workspace_id)


intelligence_service = IntelligenceService()

