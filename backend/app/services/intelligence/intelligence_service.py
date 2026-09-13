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


from app.services.intelligence.clustering_service import clustering_service


class IntelligenceService:
    """Service providing aggregated dashboard data to FastAPI routes."""

    @staticmethod
    def get_workspace_intelligence_summary(workspace_id: str, dataset_id: str | None = None) -> dict[str, Any]:
        """Fetch high-level KPI cards and top issues/features for the PM dashboard."""
        issue_clusters = intelligence_repository.get_issue_clusters(workspace_id, dataset_id, limit=5)
        if not issue_clusters:
            issue_clusters = clustering_service.ensure_issue_clusters(workspace_id, dataset_id)[:5]

        feature_clusters = intelligence_repository.get_feature_clusters(workspace_id, dataset_id, limit=5)
        if not feature_clusters:
            feature_clusters = clustering_service.ensure_feature_clusters(workspace_id, dataset_id)[:5]

        trends = intelligence_repository.get_trends(workspace_id, dataset_id, limit=5)
        insights = intelligence_repository.get_product_insights(workspace_id, dataset_id, limit=10)

        # Count types
        high_priority_count = 0
        emerging_count = 0
        opportunity_count = len(feature_clusters)

        for ins in insights:
            itype = ins.get("insight_type")
            if itype in ["HIGH_PRIORITY_ISSUE", "CRITICAL_ISSUE"] or ins.get("severity") in ["critical", "high"]:
                high_priority_count += 1
            elif itype == "EMERGING_ISSUE":
                emerging_count += 1
            elif itype in ["PRODUCT_OPPORTUNITY", "HIGH_DEMAND_FEATURE"]:
                opportunity_count += 1

        total_analyzed = (
            analysis_repository.count_by_dataset(dataset_id)
            if dataset_id
            else analysis_repository.count_by_workspace(workspace_id)
        )
        if total_analyzed == 0:
            total_analyzed = len(insights)

        opportunities = [
            ins for ins in insights if ins.get("insight_type") in ["PRODUCT_OPPORTUNITY", "HIGH_DEMAND_FEATURE"]
        ]
        if not opportunities and feature_clusters:
            opportunities = [
                {"title": fc.get("name"), "type": "FEATURE_DEMAND", "request_count": fc.get("request_count"), "confidence": fc.get("confidence", 0.9)}
                for fc in feature_clusters
            ]

        recommendations = [
            {
                "insight_id": ins.get("insight_id"),
                "title": ins.get("title"),
                "recommended_action": ins.get("recommended_action"),
                "priority_score": ins.get("priority_score"),
                "priority_level": ins.get("priority_level"),
            }
            for ins in insights
            if ins.get("recommended_action")
        ]

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
            "opportunities": serialize_documents(opportunities[:5]),
            "recommendations": serialize_documents(recommendations[:5]),
            "insights": serialize_documents(insights),
            "created_at": datetime.now(timezone.utc),
        }

    @staticmethod
    def get_issues(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        clusters = intelligence_repository.get_issue_clusters(workspace_id, dataset_id, limit)
        if not clusters:
            clusters = clustering_service.ensure_issue_clusters(workspace_id, dataset_id)[:limit]
        return serialize_documents(clusters)

    @staticmethod
    def get_features(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        clusters = intelligence_repository.get_feature_clusters(workspace_id, dataset_id, limit)
        if not clusters:
            clusters = clustering_service.ensure_feature_clusters(workspace_id, dataset_id)[:limit]
        return serialize_documents(clusters)

    @staticmethod
    def get_trends(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        return serialize_documents(intelligence_repository.get_trends(workspace_id, dataset_id, limit))

    @staticmethod
    def get_insights(workspace_id: str, dataset_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        insights = intelligence_repository.get_product_insights(workspace_id, dataset_id, limit)
        return serialize_documents(insights)

    @staticmethod
    def get_sentiment(workspace_id: str, dataset_id: str | None = None) -> dict[str, Any]:
        return sentiment_service.get_sentiment_breakdown(dataset_id=dataset_id, workspace_id=workspace_id)


intelligence_service = IntelligenceService()

