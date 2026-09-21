"""
features.py
-----------
FastAPI routes for Features Overview & Lifecycle Management.
"""

from __future__ import annotations

from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.middleware.auth_middleware import get_current_user
from app.schemas.feature import (
    FeatureCreateRequest,
    FeatureUpdateRequest,
    FeatureResponse,
    FeatureListResponse,
)
from app.services.intelligence.feature_service import feature_service

router = APIRouter(
    prefix="/workspaces/{workspace_id}/features",
    tags=["7. Features Overview & Management"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=FeatureListResponse, summary="List Features & Metrics Summary")
def list_workspace_features(
    workspace_id: str,
    dataset_id: Optional[str] = Query(None, description="Filter by feedback dataset"),
    status: Optional[str] = Query(None, description="Filter by status (Implemented, In Progress, Planned, Not Started)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Critical, High, Medium, Low)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(None, description="Filter by source"),
    search: Optional[str] = Query(None, description="Search features by name/desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Retrieve filtered list of product features and dynamic metrics summary."""
    return feature_service.list_features(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        status=status,
        priority=priority,
        category=category,
        source=source,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED, summary="Create New Feature")
def create_feature(
    workspace_id: str,
    body: FeatureCreateRequest,
    current_user=Depends(get_current_user),
):
    """Create a new feature."""
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    data = body.model_dump()
    return feature_service.create_feature(workspace_id=workspace_id, data=data, user_name=user_name)


@router.post("/extract", summary="Extract Features from Customer Feedback in Real-Time")
def extract_features(
    workspace_id: str,
    dataset_id: Optional[str] = Query(None, description="Target dataset to extract features from"),
    current_user=Depends(get_current_user),
):
    """Extract features from customer feedback records in real-time."""
    extracted = feature_service.extract_features_from_feedback(workspace_id=workspace_id, dataset_id=dataset_id)
    return {"status": "success", "extracted_count": len(extracted), "features": extracted}


@router.get("/{feature_id}", response_model=FeatureResponse, summary="Get Feature Details")
def get_feature_details(
    workspace_id: str,
    feature_id: str,
    current_user=Depends(get_current_user),
):
    """Get single feature details and evidence feedback."""
    feature = feature_service.get_feature(feature_id=feature_id, workspace_id=workspace_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return feature


@router.patch("/{feature_id}", response_model=FeatureResponse, summary="Edit Feature Attributes")
def edit_feature(
    workspace_id: str,
    feature_id: str,
    body: FeatureUpdateRequest,
    current_user=Depends(get_current_user),
):
    """Update feature properties (status, priority, category, owner, desc)."""
    updated = feature_service.update_feature(
        feature_id=feature_id,
        workspace_id=workspace_id,
        update_data=body.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Feature not found")
    return updated


@router.post("/{feature_id}/send-to-prioritization", response_model=FeatureResponse, summary="Send Feature to Prioritization")
def send_to_prioritization(
    workspace_id: str,
    feature_id: str,
    current_user=Depends(get_current_user),
):
    """Send feature to the prioritization pipeline."""
    result = feature_service.send_to_prioritization(feature_id=feature_id, workspace_id=workspace_id)
    if not result:
        raise HTTPException(status_code=404, detail="Feature not found")
    return result


@router.post("/{feature_id}/link-prd", response_model=FeatureResponse, summary="Link Feature to PRD")
def link_prd(
    workspace_id: str,
    feature_id: str,
    current_user=Depends(get_current_user),
):
    """Link feature to PRD."""
    result = feature_service.link_prd(feature_id=feature_id, workspace_id=workspace_id)
    if not result:
        raise HTTPException(status_code=404, detail="Feature not found")
    return result


@router.post("/{feature_id}/add-to-roadmap", response_model=FeatureResponse, summary="Add Feature to Roadmap")
def add_to_roadmap(
    workspace_id: str,
    feature_id: str,
    current_user=Depends(get_current_user),
):
    """Add feature to development roadmap."""
    result = feature_service.add_to_roadmap(feature_id=feature_id, workspace_id=workspace_id)
    if not result:
        raise HTTPException(status_code=404, detail="Feature not found")
    return result

