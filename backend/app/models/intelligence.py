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
        severity: str = "medium",
        root_cause_hypothesis: str = "",
        business_impact_summary: str = "",
        impacted_user_segments: list[str] | None = None,
        recommended_action: str = "",
        velocity_status: str = "stable",
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
            "severity": severity,
            "root_cause_hypothesis": root_cause_hypothesis or f"Hypothesized friction or defect in {name}",
            "business_impact_summary": business_impact_summary or f"Impacts customer workflow completion in {name}",
            "impacted_user_segments": impacted_user_segments or ["Standard Users"],
            "recommended_action": recommended_action or f"Investigate and triage {name}",
            "velocity_status": velocity_status or trend,
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
        estimated_business_value: str = "Medium",
        user_personas: list[str] | None = None,
        suggested_feature_spec: str = "",
        priority_tier: str = "medium",
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
            "customer_segments": customer_segments or ["Enterprise", "General"],
            "evidence_record_ids": evidence_record_ids or [],
            "confidence": float(confidence),
            "estimated_business_value": estimated_business_value,
            "user_personas": user_personas or ["Power User", "Operations"],
            "suggested_feature_spec": suggested_feature_spec or f"Provide automated capabilities and UI controls for {name}",
            "priority_tier": priority_tier,
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
        sentiment_breakdown: dict[str, int] | None = None,
        business_risk_level: str = "low",
        recommended_initiative: str = "",
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
            "sentiment_breakdown": sentiment_breakdown or {},
            "business_risk_level": business_risk_level,
            "recommended_initiative": recommended_initiative or f"Strategic UX & reliability review for {theme}",
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
        dominant_sentiment: str,
        severity: str,
        priority_score: float,
        priority_level: str,
        evidence_record_ids: list[str],
        affected_feature: str | dict[str, Any] = "General Module",
        customer_impact: dict[str, Any] | str | None = None,
        business_impact: dict[str, Any] | None = None,
        root_cause: dict[str, Any] | None = None,
        trend: dict[str, Any] | None = None,
        priority: dict[str, Any] | None = None,
        feature_opportunity: dict[str, Any] | None = None,
        product_recommendation: dict[str, Any] | None = None,
        recommended_next_steps: list[str] | None = None,
        evidence: dict[str, Any] | None = None,
        confidence: dict[str, Any] | None = None,
        recommended_action: str = "",
        product_id: str = "",
        analysis_version: str = "v1",
        roi_assessment: dict[str, Any] | None = None,
        technical_feasibility: dict[str, Any] | None = None,
        actionable_pm_guidance: str = "",
    ) -> dict[str, Any]:
        return {
            "insight_id": insight_id,
            "workspace_id": workspace_id,
            "product_id": product_id,
            "dataset_id": dataset_id,
            "analysis_version": analysis_version,
            "title": title,
            "insight_type": insight_type,
            "product_area": product_area,
            "affected_feature": affected_feature,
            "summary": summary,
            "dominant_sentiment": dominant_sentiment,
            "frequency": int(frequency),
            "percentage_of_feedback": float(percentage_of_feedback),
            "severity": severity,
            "customer_impact": customer_impact or {"level": "medium", "description": "Customer friction observed"},
            "business_impact": business_impact or {
                "level": "medium",
                "impact_areas": ["customer_satisfaction", "task_completion"],
                "description": "Product experience friction affecting customer outcomes.",
            },
            "root_cause": root_cause or {
                "status": "hypothesis",
                "description": "Potential friction in product workflow.",
                "confidence": 0.70,
            },
            "trend": trend or {
                "direction": "stable",
                "change_percentage": 0.0,
                "comparison_period": "previous_period",
                "current_frequency": int(frequency),
                "previous_frequency": int(frequency),
                "confidence": 0.70,
                "reason": "Observation frequency comparison.",
            },
            "priority": priority or {
                "score": float(priority_score),
                "level": priority_level,
                "reason": "Scored based on frequency, severity, and customer sentiment.",
            },
            "feature_opportunity": feature_opportunity or {
                "identified": True,
                "area": product_area,
                "opportunity": f"Enhance and optimize {product_area}",
                "expected_value": "Improve user satisfaction and streamline workflows.",
            },
            "product_recommendation": product_recommendation or {
                "action": recommended_action or f"Optimize {product_area}",
                "rationale": "Customer feedback identifies clear friction in current workflows.",
                "priority": priority_level,
            },
            "roi_assessment": roi_assessment or {
                "cost_to_implement": "Medium",
                "expected_retention_boost": "5-10%",
                "confidence_score": 0.85,
            },
            "technical_feasibility": technical_feasibility or {
                "complexity": "Moderate",
                "prerequisites": ["API schema updates", "UI state handling"],
                "estimated_sprints": 1,
            },
            "actionable_pm_guidance": actionable_pm_guidance or f"Validate user friction in {product_area} against session analytics and schedule spike with tech lead.",
            "recommended_next_steps": recommended_next_steps or [
                f"Review {product_area} operational metrics and user feedback logs.",
                "Conduct PM root-cause workflow analysis with the product squad.",
                "Prioritize corrective enhancements into next sprint planning.",
            ],
            "evidence": evidence or {
                "record_count": len(evidence_record_ids),
                "percentage": float(percentage_of_feedback),
                "record_ids": evidence_record_ids,
                "supporting_records": evidence_record_ids,
                "evidence_summary": f"Observed across {len(evidence_record_ids)} supporting customer signals.",
            },
            "confidence": confidence or {"score": 80, "level": "high"},
            # Backwards compatibility fields
            "priority_score": float(priority_score),
            "priority_level": priority_level,
            "evidence_record_ids": evidence_record_ids,
            "recommended_action": recommended_action or f"Review {product_area} workflows",
            "review_status": "PENDING_REVIEW",
            "pm_comment": None,
            "reviewed_at": None,
            "reviewed_by": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
