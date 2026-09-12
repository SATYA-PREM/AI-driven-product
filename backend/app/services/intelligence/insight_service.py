"""
insight_service.py
------------------
Service responsible for creating evidence-backed Product Intelligence insights
from issue clusters, feature clusters, and trends.
"""

from __future__ import annotations

from typing import Any
from app.core.constants import InsightType, SeverityLevel
from app.services.intelligence.scoring_service import scoring_service
from app.schemas.intelligence import ProductInsightOutput


class InsightService:
    """Transforms clusters and trends into prioritized product insights."""

    def generate_insights_from_clusters(
        self,
        issue_clusters: list[dict[str, Any]],
        feature_clusters: list[dict[str, Any]],
        trends: list[dict[str, Any]],
        workspace_id: str,
        dataset_id: str,
        total_records: int,
    ) -> list[dict[str, Any]]:
        """
        Generate actionable product insights with deterministic priority scoring
        and mandatory evidence traceability.
        """
        insights: list[dict[str, Any]] = []
        idx = 1

        # 1. Process Issue Clusters into Problem Insights
        for cluster in issue_clusters:
            freq = cluster.get("frequency", 0)
            evidence = cluster.get("evidence_record_ids", [])
            if not evidence:
                continue

            sentiment_summary = cluster.get("sentiment_summary", {})
            neg_count = sentiment_summary.get("negative", 0)
            neg_ratio = (neg_count / freq) if freq > 0 else 0.0

            # Determine severity
            severity = SeverityLevel.HIGH.value if neg_ratio >= 0.6 or freq >= 10 else SeverityLevel.MEDIUM.value
            impact = SeverityLevel.HIGH.value if freq >= 15 else SeverityLevel.MEDIUM.value

            trend_dir = cluster.get("trend", "stable")
            trend_pct = cluster.get("trend_percentage", 0.0)

            # Deterministic Priority Scoring (0-100)
            priority_score, priority_level = scoring_service.calculate_priority_score(
                frequency=freq,
                total_records=total_records,
                severity=severity,
                trend_direction=trend_dir,
                trend_percentage=trend_pct,
                negative_ratio=neg_ratio,
                customer_impact=impact,
            )

            # Insight Type classification
            if priority_score >= 80.0:
                insight_type = InsightType.HIGH_PRIORITY_ISSUE.value
            elif trend_dir in ["increasing", "emerging"]:
                insight_type = InsightType.EMERGING_ISSUE.value
            else:
                insight_type = InsightType.RECURRING_ISSUE.value

            name = cluster.get("name", "Product Issue")
            insights.append({
                "insight_id": f"PI-{idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "insight_type": insight_type,
                "title": f"{name} Requires Immediate Attention" if priority_score >= 80 else f"Recurring Reports of {name}",
                "summary": f"Customers are experiencing issues related to {name.lower()}. {freq} customer reports observed with {trend_dir} trend.",
                "product_area": name.lower().replace(" ", "_"),
                "frequency": freq,
                "percentage_of_feedback": cluster.get("percentage_of_feedback", 0.0),
                "trend": {
                    "direction": trend_dir,
                    "percentage": trend_pct,
                },
                "dominant_sentiment": "negative" if neg_ratio > 0.5 else "neutral",
                "severity": severity,
                "priority_score": priority_score,
                "priority_level": priority_level,
                "priority": {"score": priority_score, "level": priority_level},
                "customer_impact": impact,
                "evidence_record_ids": evidence,
                "recommended_action": f"Investigate system logs and customer workflows around {name.lower()} to improve user experience.",
            })
            idx += 1

        # 2. Process Feature Clusters into Opportunity Insights
        for feat in feature_clusters:
            req_count = feat.get("request_count", 0)
            evidence = feat.get("evidence_record_ids", [])
            if not evidence:
                continue

            trend_dir = feat.get("trend", "stable")
            trend_pct = feat.get("trend_percentage", 0.0)
            name = feat.get("name", "Feature Request")

            priority_score, priority_level = scoring_service.calculate_priority_score(
                frequency=req_count,
                total_records=total_records,
                severity="medium",
                trend_direction=trend_dir,
                trend_percentage=trend_pct,
                negative_ratio=0.1,  # Feature requests generally express constructive demand
                customer_impact="medium",
            )

            insight_type = InsightType.HIGH_DEMAND_FEATURE.value if req_count >= 10 else InsightType.PRODUCT_OPPORTUNITY.value

            insights.append({
                "insight_id": f"PI-{idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "insight_type": insight_type,
                "title": f"Strong Customer Demand for {name}",
                "summary": f"Multiple customer cohorts have requested {name.lower()} across recent feedback cycles.",
                "product_area": name.lower().replace(" ", "_"),
                "frequency": req_count,
                "percentage_of_feedback": feat.get("percentage_of_requests", 0.0),
                "trend": {
                    "direction": trend_dir,
                    "percentage": trend_pct,
                },
                "dominant_sentiment": "neutral",
                "severity": "low",
                "priority_score": priority_score,
                "priority_level": priority_level,
                "priority": {"score": priority_score, "level": priority_level},
                "customer_impact": "medium",
                "evidence_record_ids": evidence,
                "recommended_action": f"Evaluate technical feasibility and scope product specifications for {name.lower()}.",
            })
            idx += 1

        # Sort all insights by priority score descending
        insights.sort(key=lambda x: x["priority_score"], reverse=True)
        return insights


insight_service = InsightService()

