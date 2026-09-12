"""
intelligence.py
---------------
MongoDB document models for Product Intelligence outputs:
clusters, trends, theme patterns, and product insights.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import uuid


class IssueClusterModel:
    """Document model for the `issue_clusters` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        cluster_id: str,
        name: str,
        frequency: int,
        percentage_of_feedback: float,
        related_issues: list[str],
        sentiment_summary: dict[str, int],
        trend: str = "stable",
        trend_percentage: float = 0.0,
        evidence_record_ids: list[str] | None = None,
        confidence: float = 0.90,
    ) -> dict[str, Any]:
        return {
            "cluster_id": cluster_id,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "cluster_type": "issue",
            "name": name,
            "frequency": int(frequency),
            "percentage_of_feedback": float(percentage_of_feedback),
            "related_issues": related_issues or [],
            "sentiment_summary": sentiment_summary or {},
            "trend": trend,
            "trend_percentage": float(trend_percentage),
            "evidence_record_ids": evidence_record_ids or [],
            "confidence": float(confidence),
            "created_at": datetime.now(timezone.utc),
        }


class FeatureClusterModel:
    """Document model for the `feature_clusters` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        cluster_id: str,
        name: str,
        request_count: int,
        percentage_of_requests: float,
        related_requests: list[str],
        trend: str = "stable",
        trend_percentage: float = 0.0,
        customer_segments: list[str] | None = None,
        evidence_record_ids: list[str] | None = None,
        confidence: float = 0.90,
    ) -> dict[str, Any]:
        return {
            "cluster_id": cluster_id,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "cluster_type": "feature",
            "name": name,
            "request_count": int(request_count),
            "percentage_of_requests": float(percentage_of_requests),
            "related_requests": related_requests or [],
            "trend": trend,
            "trend_percentage": float(trend_percentage),
            "customer_segments": customer_segments or [],
            "evidence_record_ids": evidence_record_ids or [],
            "confidence": float(confidence),
            "created_at": datetime.now(timezone.utc),
        }


class TrendModel:
    """Document model for the `trends` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        trend_id: str,
        subject_type: str,
        subject: str,
        previous_period_count: int,
        current_period_count: int,
        change_percentage: float,
        direction: str,
        trend_strength: str = "medium",
        evidence_record_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        return {
            "trend_id": trend_id,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "subject_type": subject_type,
            "subject": subject,
            "previous_period_count": int(previous_period_count),
            "current_period_count": int(current_period_count),
            "change_percentage": float(change_percentage),
            "direction": direction,
            "trend_strength": trend_strength,
            "evidence_record_ids": evidence_record_ids or [],
            "created_at": datetime.now(timezone.utc),
        }


class ThemePatternModel:
    """Document model for the `theme_patterns` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        theme: str,
        feedback_count: int,
        percentage: float,
        dominant_sentiment: str,
        top_issues: list[str] | None = None,
        top_feature_requests: list[str] | None = None,
    ) -> dict[str, Any]:
        return {
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "theme": theme,
            "feedback_count": int(feedback_count),
            "percentage": float(percentage),
            "dominant_sentiment": dominant_sentiment,
            "top_issues": top_issues or [],
            "top_feature_requests": top_feature_requests or [],
            "created_at": datetime.now(timezone.utc),
        }


class ProductInsightModel:
    """Document model for the `product_insights` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        insight_id: str,
        insight_type: str,
        title: str,
        summary: str,
        product_area: str,
        frequency: int,
        percentage_of_feedback: float,
        trend: dict[str, Any],
        dominant_sentiment: str,
        severity: str,
        priority_score: float,
        priority_level: str,
        customer_impact: str,
        evidence_record_ids: list[str],
        recommended_action: str,
        product_id: str = "",
        analysis_version: str = "v1",
    ) -> dict[str, Any]:
        return {
            "insight_id": insight_id,
            "workspace_id": workspace_id,
            "product_id": product_id,
            "dataset_id": dataset_id,
            "insight_type": insight_type,
            "title": title,
            "summary": summary,
            "product_area": product_area,
            "frequency": int(frequency),
            "percentage_of_feedback": float(percentage_of_feedback),
            "trend": trend,
            "dominant_sentiment": dominant_sentiment,
            "severity": severity,
            "priority": {
                "score": float(priority_score),
                "level": priority_level,
            },
            "customer_impact": customer_impact,
            "evidence_record_ids": evidence_record_ids,
            "recommended_action": recommended_action,
            "analysis_version": analysis_version,
            "created_at": datetime.now(timezone.utc),
        }
