"""
intelligence.py
---------------
Pydantic schemas for Agent 2 (Pattern & Trend) and Agent 3 (Product Intelligence)
outputs, API responses, and dashboard views.
"""

from __future__ import annotations

from typing import Literal, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.core.constants import (
    TrendDirection,
    SeverityLevel,
    PriorityLevel,
    InsightType,
    ClusterType,
)


# ──────────────────────────────────────────────
# Agent 2: Pattern & Trend Schemas
# ──────────────────────────────────────────────

class IssueClusterOutput(BaseModel):
    """Semantic cluster of related product issues produced by Agent 2."""
    cluster_id: str = Field(description="Unique cluster identifier, e.g. ISSUE-001")
    cluster_type: Literal["issue"] = "issue"
    name: str = Field(description="Normalized name for the issue cluster")
    frequency: int = Field(ge=0, description="Total number of feedback records in this cluster")
    percentage_of_feedback: float = Field(
        ge=0.0, le=100.0, default=0.0, description="Percentage of total dataset feedback"
    )
    related_issues: list[str] = Field(
        default_factory=list, description="Original issue phrases grouped into this cluster"
    )
    sentiment_summary: dict[str, int] = Field(
        default_factory=dict, description="Counts of sentiment breakdown within cluster"
    )
    trend: Literal["increasing", "decreasing", "stable", "new", "emerging", "declining"] = "stable"
    trend_percentage: float = Field(
        default=0.0, description="Period-over-period trend growth percentage"
    )
    evidence_record_ids: list[str] = Field(
        default_factory=list, description="IDs of supporting customer feedback records"
    )
    confidence: float = Field(
        ge=0.0, le=1.0, default=0.90, description="Semantic clustering confidence"
    )
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    root_cause_hypothesis: str = ""
    business_impact_summary: str = ""
    impacted_user_segments: list[str] = Field(default_factory=list)
    recommended_action: str = ""
    velocity_status: str = "stable"

    model_config = ConfigDict(extra="ignore")


class FeatureClusterOutput(BaseModel):
    """Semantic cluster of customer feature requests produced by Agent 2."""
    cluster_id: str = Field(description="Unique cluster identifier, e.g. FEATURE-001")
    cluster_type: Literal["feature"] = "feature"
    name: str = Field(description="Normalized name for the feature request")
    request_count: int = Field(ge=0, description="Number of times requested")
    percentage_of_requests: float = Field(
        ge=0.0, le=100.0, default=0.0, description="Percentage of total feature requests"
    )
    related_requests: list[str] = Field(
        default_factory=list, description="Individual request phrases grouped"
    )
    trend: Literal["increasing", "decreasing", "stable", "new", "emerging", "declining"] = "stable"
    trend_percentage: float = Field(default=0.0, description="Trend growth percentage")
    customer_segments: list[str] = Field(
        default_factory=list, description="Customer segments requesting this feature"
    )
    evidence_record_ids: list[str] = Field(
        default_factory=list, description="IDs of supporting customer feedback records"
    )
    confidence: float = Field(
        ge=0.0, le=1.0, default=0.90, description="Semantic clustering confidence"
    )
    estimated_business_value: str = "Medium"
    user_personas: list[str] = Field(default_factory=list)
    suggested_feature_spec: str = ""
    priority_tier: str = "medium"

    model_config = ConfigDict(extra="ignore")


class TrendOutput(BaseModel):
    """Time-series or period comparison trend produced by Agent 2."""
    trend_id: str = Field(description="Unique trend identifier, e.g. TREND-001")
    subject_type: Literal["issue", "feature", "theme"] = Field(
        description="Target entity type of the trend"
    )
    subject: str = Field(description="Name of the issue, feature, or theme")
    previous_period_count: int = Field(ge=0, default=0)
    current_period_count: int = Field(ge=0, default=0)
    change_percentage: float = Field(default=0.0)
    direction: Literal["increasing", "decreasing", "stable", "new", "emerging", "declining"] = "stable"
    trend_strength: Literal["low", "medium", "high"] = "medium"
    evidence_record_ids: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class ThemePatternOutput(BaseModel):
    """High-level theme breakdown pattern produced by Agent 2."""
    theme: str
    feedback_count: int = 0
    percentage: float = 0.0
    dominant_sentiment: str = "neutral"
    top_issues: list[str] = Field(default_factory=list)
    top_feature_requests: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


# ──────────────────────────────────────────────
# Agent 3: Product Intelligence Schemas
# ──────────────────────────────────────────────

class CustomerImpactDetail(BaseModel):
    """Customer experience friction and impact description."""
    level: str = "medium"
    description: str = Field(description="Impact on customer workflow or satisfaction")

    model_config = ConfigDict(extra="ignore")


class BusinessImpact(BaseModel):
    """Business justification and quantified organizational risk."""
    level: str = "medium"
    impact_areas: list[str] = Field(
        default_factory=lambda: ["customer_satisfaction", "task_completion"],
        description="Key impacted business metrics e.g. user_retention, task_completion, revenue_risk",
    )
    description: str = Field(description="Strategic narrative explaining why this matters to the business")

    model_config = ConfigDict(extra="ignore")


class RootCauseHypothesis(BaseModel):
    """Underlying architectural or design hypothesis for observed feedback."""
    status: Literal["hypothesis", "identified", "inconclusive"] = "hypothesis"
    description: str = Field(description="Probable product-level root cause hypothesis")
    confidence: float = Field(ge=0.0, le=1.0, default=0.70, description="Confidence in the hypothesis")

    model_config = ConfigDict(extra="ignore")


class FeatureOpportunity(BaseModel):
    """Identified product opportunity derived from customer feedback."""
    identified: bool = True
    area: str | None = None
    opportunity: str = Field(description="Specific product opportunity description")
    expected_value: str = Field(description="Expected business and customer value outcome")

    model_config = ConfigDict(extra="ignore")


class ProductRecommendation(BaseModel):
    """Concrete strategic product recommendation for PM review."""
    action: str = Field(description="Target product decision or implementation action")
    rationale: str = Field(description="Evidence-backed rationale justifying the recommendation")
    priority: str = "medium"

    model_config = ConfigDict(extra="ignore")


class InsightEvidence(BaseModel):
    """Detailed evidence supporting the product insight."""
    record_count: int = Field(ge=1, description="Number of supporting feedback signals")
    percentage: float = Field(ge=0.0, le=100.0, default=0.0, description="Share of dataset feedback")
    record_ids: list[str] = Field(min_length=1, description="List of supporting feedback IDs")
    supporting_records: list[str] = Field(default_factory=list, description="Aliases of supporting records")
    evidence_summary: str = Field(default="", description="Qualitative summary of customer evidence")

    model_config = ConfigDict(extra="ignore")


class InsightConfidence(BaseModel):
    """Statistical and semantic confidence in the formulated insight."""
    score: int | float = Field(ge=0, le=100, default=80)
    level: Literal["low", "medium", "high", "very_high"] = "high"

    model_config = ConfigDict(extra="ignore")


class PriorityDetail(BaseModel):
    """Deterministic priority score and explanatory rationale."""
    score: float = Field(ge=0.0, le=100.0)
    level: str = "medium"
    reason: str = Field(description="Transparent breakdown explaining the priority score")

    model_config = ConfigDict(extra="ignore")


class TrendDetail(BaseModel):
    """Time-series trend velocity and historical observation context."""
    direction: Literal["increasing", "decreasing", "stable", "emerging", "new", "insufficient_data"] = "stable"
    change_percentage: float | None = 0.0
    comparison_period: str = "previous_period"
    current_frequency: int = 1
    previous_frequency: int = 1
    confidence: float = 0.70
    reason: str = "Historical comparison based on observation frequency."

    model_config = ConfigDict(extra="ignore")


class ProductInsightOutput(BaseModel):
    """
    Actionable product intelligence insight generated by Agent 3 with mandatory customer evidence.
    Complete Product Intelligence insight generated by Agent 3.
    Combines problem synthesis, customer & business impact, root-cause hypothesis,
    feature opportunities, deterministic priority rationale, and multi-step action plans.
    """
    insight_id: str = Field(description="Unique insight identifier, e.g. PI-001")
    workspace_id: str | None = None
    dataset_id: str | None = None
    analysis_version: str = "v1"

    title: str = Field(description="Concise, actionable headline")
    insight_type: Literal[
        "HIGH_PRIORITY_ISSUE",
        "EMERGING_ISSUE",
        "RECURRING_ISSUE",
        "PRODUCT_OPPORTUNITY",
        "HIGH_DEMAND_FEATURE",
        "NEGATIVE_TREND",
        "POSITIVE_TREND",
        "CUSTOMER_EXPERIENCE_RISK",
    ]
    product_area: str = Field(description="Broad target product area e.g. search_usability")
    affected_feature: str | dict[str, Any] = Field(
        default="General Module", description="Specific feature or component impacted"
    )
    summary: str = Field(description="Executive summary of problem or opportunity")
    dominant_sentiment: str = "neutral"
    frequency: int = Field(ge=0, description="Number of feedback records affected")
    percentage_of_feedback: float = Field(ge=0.0, le=100.0, default=0.0)
    severity: Literal["low", "medium", "high", "critical"] = "medium"

    # Deep Decision Fields
    customer_impact: CustomerImpactDetail | str = Field(
        default_factory=lambda: CustomerImpactDetail(level="medium", description="User friction reported")
    )
    business_impact: BusinessImpact = Field(
        default_factory=lambda: BusinessImpact(level="medium", impact_areas=["customer_satisfaction"], description="Operational friction")
    )
    root_cause: RootCauseHypothesis = Field(
        default_factory=lambda: RootCauseHypothesis(status="hypothesis", description="Underlying workflow friction", confidence=0.70)
    )
    trend: TrendDetail | dict[str, Any] = Field(
        default_factory=lambda: TrendDetail()
    )
    priority: PriorityDetail | dict[str, Any] = Field(
        default_factory=lambda: PriorityDetail(score=50.0, level="medium", reason="Balanced scoring")
    )
    feature_opportunity: FeatureOpportunity = Field(
        default_factory=lambda: FeatureOpportunity(identified=True, opportunity="Workflow improvement", expected_value="Reduce friction")
    )
    product_recommendation: ProductRecommendation = Field(
        default_factory=lambda: ProductRecommendation(action="Review workflow", rationale="Feedback indicates friction", priority="medium")
    )
    recommended_next_steps: list[str] = Field(
        default_factory=list, description="Actionable PM and engineering steps"
    )
    evidence: InsightEvidence | None = None
    confidence: InsightConfidence | dict[str, Any] = Field(
        default_factory=lambda: InsightConfidence(score=80, level="high")
    )

    # Backwards Compatibility Fields
    priority_score: float = Field(ge=0.0, le=100.0, default=50.0)
    priority_level: Literal["low", "medium", "high", "critical"] = "medium"
    evidence_record_ids: list[str] = Field(
        min_length=1, description="Mandatory list of at least 1 supporting feedback ID"
    )
    recommended_action: str = Field(
        default="Review product workflow", description="Strategic product recommendation"
    )
    roi_assessment: dict[str, Any] = Field(
        default_factory=dict, description="Estimated ROI and retention impact"
    )
    technical_feasibility: dict[str, Any] = Field(
        default_factory=dict, description="Technical complexity and delivery feasibility"
    )
    actionable_pm_guidance: str = Field(
        default="", description="Targeted PM recommendation for sprint and roadmap planning"
    )

    # PM Review Decision Gate Fields
    review_status: Literal["PENDING_REVIEW", "ACCEPTED", "REJECTED", "REANALYSIS_REQUESTED"] = "PENDING_REVIEW"
    pm_comment: str | None = None
    reviewed_at: datetime | str | None = None
    reviewed_by: str | None = None

    model_config = ConfigDict(extra="ignore")


class InsightReviewRequest(BaseModel):
    """Payload submitted by Product Manager when reviewing an AI insight."""
    review_status: Literal["ACCEPTED", "REJECTED", "REANALYSIS_REQUESTED", "PENDING_REVIEW"]
    pm_comment: str | None = None


class ProductIntelligenceSummaryResponse(BaseModel):
    """Top-level workspace intelligence summary for dashboard KPI cards."""
    workspace_id: str
    dataset_id: str | None = None
    summary: dict[str, int] = {
        "total_insights": 0,
        "high_priority_issues": 0,
        "emerging_issues": 0,
        "high_demand_features": 0,
        "total_feedback_analyzed": 0,
    }
    top_issues: list[dict[str, Any]] = []
    top_features: list[dict[str, Any]] = []
    trends: list[dict[str, Any]] = []
    opportunities: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    created_at: datetime | str | None = None

    model_config = ConfigDict(extra="ignore")


class SentimentDistributionResponse(BaseModel):
    """Aggregated sentiment breakdown across customer feedback."""
    workspace_id: str
    dataset_id: str | None = None
    total_count: int = 0
    distribution: dict[str, int] = {
        "positive": 0,
        "negative": 0,
        "neutral": 0,
        "mixed": 0,
    }
    percentages: dict[str, float] = {
        "positive": 0.0,
        "negative": 0.0,
        "neutral": 0.0,
        "mixed": 0.0,
    }

    model_config = ConfigDict(extra="ignore")

