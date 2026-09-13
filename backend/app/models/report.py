"""
report.py
---------
MongoDB document model for executive product intelligence reports.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class ReportModel:
    """Document model for the `reports` collection."""

    @staticmethod
    def create_document(
        report_id: str,
        workspace_id: str,
        dataset_id: str | None,
        report_type: str,
        title: str,
        status: str,
        summary_kpis: dict[str, Any],
        executive_takeaways: list[str],
        prioritized_issues: list[dict[str, Any]],
        feature_demand_ranking: list[dict[str, Any]],
        emerging_trends: list[dict[str, Any]],
        sentiment_overview: dict[str, Any],
        recommended_next_steps: list[str],
    ) -> dict[str, Any]:
        return {
            "report_id": report_id,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "report_type": report_type,
            "title": title,
            "status": status,
            "summary_kpis": summary_kpis,
            "executive_takeaways": executive_takeaways,
            "prioritized_issues": prioritized_issues,
            "feature_demand_ranking": feature_demand_ranking,
            "emerging_trends": emerging_trends,
            "sentiment_overview": sentiment_overview,
            "recommended_next_steps": recommended_next_steps,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

