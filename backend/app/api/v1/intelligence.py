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

router = APIRouter(prefix="/workspaces/{workspace_id}/intelligence", tags=["Product Intelligence"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=ProductIntelligenceSummaryResponse)
def get_workspace_intelligence(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get complete Product Intelligence overview for a workspace."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id)


@router.get("/summary", response_model=ProductIntelligenceSummaryResponse)
def get_intelligence_summary(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get dashboard summary metrics and top cards."""
    return intelligence_service.get_workspace_intelligence_summary(workspace_id, dataset_id)


@router.get("/issues", response_model=list[dict[str, Any]])
def get_intelligence_issues(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get detected issue clusters grouped by semantic similarity."""
    return intelligence_service.get_issues(workspace_id, dataset_id, limit)


@router.get("/features", response_model=list[dict[str, Any]])
def get_intelligence_features(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get customer feature request clusters and demand rankings."""
    return intelligence_service.get_features(workspace_id, dataset_id, limit)


@router.get("/trends", response_model=list[dict[str, Any]])
def get_intelligence_trends(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Get detected trends and period-over-period changes."""
    return intelligence_service.get_trends(workspace_id, dataset_id, limit)


@router.get("/sentiment", response_model=SentimentDistributionResponse)
def get_intelligence_sentiment(
    workspace_id: str,
    dataset_id: str | None = Query(None, description="Filter by specific dataset"),
    current_user=Depends(get_current_user),
):
    """Get aggregated customer sentiment distribution."""
    return intelligence_service.get_sentiment(workspace_id, dataset_id)

