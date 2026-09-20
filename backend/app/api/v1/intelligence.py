"""
intelligence.py
---------------
FastAPI routes for the Product Intelligence dashboard:
summary KPI cards, issue clusters, feature demand, trends, sentiment, insights, and comparison.
Supports product_id and dataset_id filtering.
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query

from app.middleware.auth_middleware import get_current_user
from app.services.intelligence.intelligence_service import intelligence_service
from app.schemas.intelligence import (
    ProductIntelligenceSummaryResponse,
    SentimentDistributionResponse,
    InsightReviewRequest,
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
    product_id: str | None = Query(None, description="Filter by specific product"),
    current_user=Depends(get_current_user),
):
    """Get complete Product Intelligence overview for a workspace."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id, product_id)


@router.get("/summary", response_model=ProductIntelligenceSummaryResponse, summary="Get Executive KPI Summary Metrics")
def get_intelligence_summary(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    current_user=Depends(get_current_user),
):
    """Get dashboard summary metrics, critical issue alerts, and top priority cards."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id, product_id)


@router.get("/issues", response_model=list[dict[str, Any]], summary="Get Priority-Scored Semantic Issue Clusters")
def get_intelligence_issues(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """
    **Semantic Issue Clusters with Deterministic Priority Scores (0–100):**
    Returns issues clustered by Agent 2 and scored by Agent 3 using:
    `Score = (Frequency*0.35) + (Severity*0.25) + (Trend*0.15) + (Sentiment*0.15) + (Impact*0.10)`.
    """
    return intelligence_service.get_issues(workspace_id, dataset_id, product_id, limit)


@router.get("/features", response_model=list[dict[str, Any]], summary="Get Ranked Feature Demands & Clustering")
def get_intelligence_features(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get customer feature request clusters, mention frequencies, and demand rankings."""
    return intelligence_service.get_features(workspace_id, dataset_id, product_id, limit)


@router.get("/trends", response_model=list[dict[str, Any]], summary="Get Period-over-Period Trend Velocity & Direction")
def get_intelligence_trends(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get detected trends, velocity percentages, and trend direction (increasing, decreasing, stable)."""
    return intelligence_service.get_trends(workspace_id, dataset_id, product_id, limit)


@router.get("/sentiment", response_model=SentimentDistributionResponse, summary="Get Workspace Sentiment Distribution")
def get_intelligence_sentiment(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    current_user=Depends(get_current_user),
):
    """Get aggregated customer sentiment breakdown across themes and overall ratio."""
    return intelligence_service.get_sentiment(workspace_id, dataset_id, product_id)


@router.get("/insights", response_model=list[dict[str, Any]], summary="Get Complete Product Intelligence Decision Insights")
def get_intelligence_insights(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """
    **Comprehensive Product Intelligence Insights for PM Decision-Making:**
    Each insight synthesizes feedback patterns into 10 structured PM decision fields.
    """
    return intelligence_service.get_insights(workspace_id, dataset_id, product_id, limit)


@router.get("/comparison", response_model=dict[str, Any], summary="Get Period-over-Period & Dataset Comparison Metrics")
def get_intelligence_comparison(
    workspace_id: str,
    comparison_type: str = Query("Time Comparison", description="Comparison mode"),
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    product_id: str | None = Query(None, description="Filter by specific product"),
    quick_range: str = Query("Last 30 Days", description="Quick range selector"),
    current_user=Depends(get_current_user),
):
    """Get period-over-period and dataset comparison analytics backed by live MongoDB data."""
    return intelligence_service.get_comparison_data(
        workspace_id=workspace_id,
        comparison_type=comparison_type,
        dataset_id=dataset_id,
        product_id=product_id,
        quick_range=quick_range,
    )


@router.patch("/insights/{insight_id}/review", response_model=dict[str, Any], summary="Submit PM Decision Review on an Insight")
def submit_insight_review(
    workspace_id: str,
    insight_id: str,
    payload: InsightReviewRequest,
    current_user=Depends(get_current_user),
):
    """
    **PM Review Decision Gate:**
    Product Manager reviews the AI-generated insight, evaluates evidence, and records
    a strategic decision: `ACCEPTED`, `REJECTED`, or `REANALYSIS_REQUESTED`.
    Approved insights advance into Product Planning & PRD generation.
    """
    reviewer = getattr(current_user, "email", None) or getattr(current_user, "id", None) or "PM"
    return intelligence_service.update_insight_review(
        workspace_id=workspace_id,
        insight_id=insight_id,
        review_status=payload.review_status,
        pm_comment=payload.pm_comment,
        reviewed_by=str(reviewer),
    )


@router.get("/insights/{insight_id}/evidence", response_model=dict[str, Any], summary="Get Traceable Customer Evidence for Insight")
def get_insight_evidence(
    workspace_id: str,
    insight_id: str,
    current_user=Depends(get_current_user),
):
    """
    **Verifiable Ground-Truth Customer Evidence:**
    Retrieves full customer quotes, sentiment, intent, and timestamp for all feedback records
    linked to an insight.
    """
    return intelligence_service.get_insight_evidence(
        workspace_id=workspace_id,
        insight_id=insight_id,
    )

