"""
Customer Feedback API Router.
Provides endpoints for Feedback Management, metrics aggregation, manual logging, and feature mapping.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.middleware.auth_middleware import get_current_user
from app.schemas.feedback import (
    FeedbackListResponse,
    FeedbackMetricsResponse,
    FeedbackItemResponse,
    FeedbackCreateRequest,
    FeedbackUpdateRequest,
    FeedbackMapFeatureRequest,
)
from app.services.intelligence.feedback_service import FeedbackService

router = APIRouter(
    prefix="/workspaces/{workspace_id}/feedback",
    tags=["Customer Feedback"],
    dependencies=[Depends(get_current_user)],
)
feedback_service = FeedbackService()


@router.get("", response_model=FeedbackListResponse)
def list_feedback(
    workspace_id: str,
    status: Optional[str] = Query(None, description="Status filter: All, New, In Review, Resolved, Snoozed, Unresolved"),
    sentiment: Optional[str] = Query(None, description="Sentiment: All, Positive, Neutral, Negative"),
    category: Optional[str] = Query(None, description="Category filter"),
    source: Optional[str] = Query(None, description="Source filter: App Store, Play Store, Support, Survey, Social Media, Manual"),
    priority: Optional[str] = Query(None, description="Priority: Critical, High, Medium, Low"),
    assigned_to: Optional[str] = Query(None, description="Assigned user or 'Me'"),
    mapped: Optional[bool] = Query(None, description="Filter mapped vs unmapped feedback"),
    search: Optional[str] = Query(None, description="Search keyword"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Retrieve filtered customer feedback records and summary analytics."""
    return feedback_service.list_feedback(
        workspace_id=workspace_id,
        status=status,
        sentiment=sentiment,
        category=category,
        source=source,
        priority=priority,
        assigned_to=assigned_to,
        mapped=mapped,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/metrics", response_model=FeedbackMetricsResponse)
def get_feedback_metrics(workspace_id: str):
    """Get high-level KPIs, 30-day velocity trend, source distribution, and top themes."""
    return feedback_service.get_metrics(workspace_id=workspace_id)


@router.post("", response_model=FeedbackItemResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(workspace_id: str, req: FeedbackCreateRequest):
    """Manually add new customer feedback."""
    return feedback_service.create_feedback(workspace_id=workspace_id, req=req)


@router.get("/{feedback_id}", response_model=FeedbackItemResponse)
def get_feedback(workspace_id: str, feedback_id: str):
    """Retrieve detailed feedback with AI analysis and linked features."""
    item = feedback_service.get_feedback_by_id(workspace_id=workspace_id, feedback_id=feedback_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback '{feedback_id}' not found in workspace '{workspace_id}'.",
        )
    return item


@router.patch("/{feedback_id}", response_model=FeedbackItemResponse)
def update_feedback(workspace_id: str, feedback_id: str, req: FeedbackUpdateRequest):
    """Update feedback status, priority, or assignment."""
    updated = feedback_service.update_feedback(
        workspace_id=workspace_id, feedback_id=feedback_id, req=req
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback '{feedback_id}' not found.",
        )
    return updated


@router.post("/{feedback_id}/map-feature", response_model=FeedbackItemResponse)
def map_feedback_to_feature(workspace_id: str, feedback_id: str, req: FeedbackMapFeatureRequest):
    """Link feedback to a feature or generate a new feature candidate."""
    mapped = feedback_service.map_feature(
        workspace_id=workspace_id, feedback_id=feedback_id, req=req
    )
    if not mapped:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback '{feedback_id}' not found.",
        )
    return mapped

