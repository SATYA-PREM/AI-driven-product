"""
designer.py
-----------
FastAPI routes for Product Designer Workspace, UX Requirements & Design Responses.
"""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Path

from app.schemas.designer import (
    DesignerDashboardResponse,
    DesignerTaskItem,
    UXRequirementDetail,
    DesignerProductContextResponse,
    DesignerCustomerFeedbackItem,
    DesignResponseSubmit,
)
from app.middleware.auth_middleware import get_current_user
from app.services.designer_service import designer_service

router = APIRouter(tags=["Product Designer Workspace"])


@router.get(
    "/workspaces/{workspace_id}/designer/dashboard",
    response_model=DesignerDashboardResponse,
    summary="Get Designer Dashboard KPI metrics and active tasks",
)
def get_designer_dashboard(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    role = current_user.get("role") or "designer"
    email = current_user.get("email") or ""
    return designer_service.get_designer_dashboard(
        workspace_id=workspace_id,
        user_id=user_id,
        user_role=role,
        email=email,
    )


@router.get(
    "/workspaces/{workspace_id}/designer/assignments",
    response_model=List[DesignerTaskItem],
    summary="Get all assigned requirements for Product Designer",
)
def get_designer_assignments(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return designer_service.get_designer_assignments(
        workspace_id=workspace_id,
        user_id=user_id,
        email=email,
    )


@router.get(
    "/workspaces/{workspace_id}/designer/product-context",
    response_model=DesignerProductContextResponse,
    summary="Get strategic product context and design goals",
)
def get_designer_product_context(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_designer_product_context(workspace_id=workspace_id)


@router.get(
    "/workspaces/{workspace_id}/designer/ux-requirements",
    response_model=List[UXRequirementDetail],
    summary="Get UX requirements and wireframe criteria",
)
def get_designer_ux_requirements(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return designer_service.get_designer_ux_requirements(
        workspace_id=workspace_id,
        user_id=user_id,
        email=email,
    )


@router.get(
    "/workspaces/{workspace_id}/designer/customer-feedback",
    response_model=List[DesignerCustomerFeedbackItem],
    summary="Get customer feedback relevant to UX & UI design",
)
def get_designer_customer_feedback(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_designer_customer_feedback(workspace_id=workspace_id)


@router.post(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/response",
    response_model=DesignerTaskItem,
    summary="Submit design response, Figma link and status",
)
def submit_design_response(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: DesignResponseSubmit = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Product Designer"
    try:
        updated = designer_service.submit_design_response(
            workspace_id=workspace_id,
            assignment_id=assignment_id,
            payload=body,
            submitted_by=user_name,
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

