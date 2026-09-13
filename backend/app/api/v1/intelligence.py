"""
intelligence.py
---------------
FastAPI routes for the Product Intelligence dashboard:
summary KPI cards, issue clusters, feature demand, trends, and sentiment.
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query

from app.middleware.auth_middleware import get_current_user
from app.services.intelligence.intelligence_service import intelligence_service
from app.schemas.intelligence import (
    ProductIntelligenceSummaryResponse,
    SentimentDistributionResponse,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/intelligence",
    tags=["7. Product Intelligence & PM Dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=ProductIntelligenceSummaryResponse, summary="Get Complete Product Intelligence Overview")
def get_workspace_intelligence(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get complete Product Intelligence overview for a workspace."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id)


@router.get("/summary", response_model=ProductIntelligenceSummaryResponse, summary="Get Executive KPI Summary Metrics")
def get_intelligence_summary(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get dashboard summary metrics, critical issue alerts, and top priority cards."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id)


@router.get("/issues", response_model=list[dict[str, Any]], summary="Get Priority-Scored Semantic Issue Clusters")
def get_intelligence_issues(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """
    **Semantic Issue Clusters with Deterministic Priority Scores (0–100):**
    Returns issues clustered by Agent 2 and scored by Agent 3 using:
    `Score = (Frequency*0.35) + (Severity*0.25) + (Trend*0.15) + (Sentiment*0.15) + (Impact*0.10)`.
    """
    return intelligence_service.get_issues(workspace_id, dataset_id, limit)


@router.get("/features", response_model=list[dict[str, Any]], summary="Get Ranked Feature Demands & Clustering")
def get_intelligence_features(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get customer feature request clusters, mention frequencies, and demand rankings."""
    return intelligence_service.get_features(workspace_id, dataset_id, limit)


@router.get("/trends", response_model=list[dict[str, Any]], summary="Get Period-over-Period Trend Velocity & Direction")
def get_intelligence_trends(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get detected trends, velocity percentages, and trend direction (increasing, decreasing, stable)."""
    return intelligence_service.get_trends(workspace_id, dataset_id, limit)


@router.get("/sentiment", response_model=SentimentDistributionResponse, summary="Get Workspace Sentiment Distribution")
def get_intelligence_sentiment(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get aggregated customer sentiment breakdown across themes and overall ratio."""
    return intelligence_service.get_sentiment(workspace_id, dataset_id)


@router.get("/insights", response_model=list[dict[str, Any]], summary="Get Complete Product Intelligence Decision Insights")
def get_intelligence_insights(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """
    **Comprehensive Product Intelligence Insights for PM Decision-Making:**
    Each insight synthesizes feedback patterns into 10 structured PM decision fields:
    1. `business_impact`: Quantified risk, retention impact, and metric areas.
    2. `feature_opportunity`: Identified product opportunity and expected value.
    3. `product_recommendation`: Concrete strategic action with rationale.
    4. `root_cause`: Hypothesis on UX/technical friction with confidence level.
    5. `affected_feature`: Component name (e.g. "Product Search & Filter Engine").
    6. `evidence`: Record IDs, count, percentage, and qualitative summary.
    7. `confidence`: Statistical score and confidence band.
    8. `recommended_next_steps`: Multi-step actionable engineering/PM steps.
    9. `priority`: Deterministic score (0-100) with transparent rationale.
    10. `trend`: Velocity direction, comparison period, and delta percentage.
    """
    return intelligence_service.get_insights(workspace_id, dataset_id, limit)

