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
    DesignReviewCreate,
    BlockerCreate,
    ClarificationCreate,
)
from app.middleware.auth_middleware import get_current_user
from app.services.designer_service import designer_service

router = APIRouter(tags=["13. Product Designer Workspace"])


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
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}",
    response_model=DesignerTaskItem,
    summary="Get single designer assignment detail by ID",
)
def get_designer_assignment_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    item = designer_service.get_assignment_by_id(workspace_id=workspace_id, assignment_id=assignment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Design assignment not found")
    return item


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
    summary="Submit design response, deliverables, Figma links, and update assignment status",
)
def submit_design_response(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: DesignResponseSubmit = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Product Designer"
    user_role = current_user.get("role") or "designer"
    try:
        updated = designer_service.submit_design_response(
            workspace_id=workspace_id,
            assignment_id=assignment_id,
            payload=body,
            submitted_by=user_name,
            user_role=user_role,
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/submissions",
    summary="Get immutable submission history and revisions for an assignment",
)
def get_assignment_submissions(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_assignment_submissions(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
    )


@router.post(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/review",
    response_model=DesignerTaskItem,
    summary="PM Review of Design Submission (Approve or Request Revision)",
)
def review_design_submission(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: DesignReviewCreate = ...,
    current_user=Depends(get_current_user),
):
    user_role = (current_user.get("role") or "").lower()
    # Enforce PM/Admin authorization check: Designer cannot approve their own submission
    if user_role not in ["admin", "superadmin", "owner", "product_manager", "product manager", "pm"]:
        raise HTTPException(status_code=403, detail="Only Product Managers can review and approve design submissions.")

    reviewer_name = current_user.get("name") or current_user.get("email") or "Product Manager"
    try:
        updated = designer_service.review_submission(
            workspace_id=workspace_id,
            assignment_id=assignment_id,
            payload=body,
            reviewer_name=reviewer_name,
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/reviews",
    summary="Get review comments and decisions for an assignment",
)
def get_assignment_reviews(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_assignment_reviews(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
    )


@router.post(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/blocker",
    summary="Report a blocker on design assignment",
)
def report_designer_blocker(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: BlockerCreate = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Product Designer"
    return designer_service.report_blocker(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
        payload=body,
        user_name=user_name,
    )


@router.get(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/blockers",
    summary="Get blockers reported on an assignment",
)
def get_designer_blockers(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_assignment_blockers(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
    )


@router.post(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/clarification",
    summary="Request requirement clarification from PM",
)
def request_designer_clarification(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: ClarificationCreate = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Product Designer"
    return designer_service.request_clarification(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
        payload=body,
        user_name=user_name,
    )


@router.get(
    "/workspaces/{workspace_id}/designer/assignments/{assignment_id}/clarifications",
    summary="Get clarifications requested on an assignment",
)
def get_designer_clarifications(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    return designer_service.get_assignment_clarifications(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
    )


