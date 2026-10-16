"""
stakeholder.py
--------------
FastAPI routes for the Business Owner / Stakeholder Workspace:
- Executive Dashboard with real KPI metrics & sync status
- Product Overview and business objectives
- High-level Roadmap & initiative portfolio
- Pending Approvals & tamper-proof decision submission
- Immutable Decision History audit trail
- PRD Business Review & structured feedback
- Milestones and risk register
- Business impact & success metrics
- Notifications
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status

from app.schemas.stakeholder import (
    StakeholderDashboardResponse,
    ProductOverviewResponse,
    BusinessObjectiveItem,
    BusinessObjectiveCreate,
    RoadmapInitiativeItem,
    ApprovalRequestItem,
    DecisionSubmitRequest,
    DecisionRecordItem,
    StakeholderFeedbackItem,
    StakeholderFeedbackCreate,
    PMFeedbackResponseSubmit,
    MilestoneItem,
    BusinessMetricItem,
    BusinessRiskItem,
    BusinessDependencyItem,
    StakeholderNotificationItem,
)
from app.middleware.auth_middleware import get_current_user
from app.services.stakeholder_service import stakeholder_service
from app.services.auth.permission_service import permission_service
from app.core.constants import Permission

router = APIRouter(
    prefix="/workspaces/{workspace_id}/stakeholder",
    tags=["17. Business Owner / Stakeholder Workspace"],
    dependencies=[Depends(get_current_user)],
)


# ──────────────────────────────────────────────
# 1. Stakeholder Dashboard
# ──────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=StakeholderDashboardResponse,
    summary="Get Stakeholder Executive Dashboard & KPIs",
)
def get_stakeholder_dashboard(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_email = current_user.get("email") or ""
    return stakeholder_service.get_dashboard(workspace_id=workspace_id, user_email=user_email)


# ──────────────────────────────────────────────
# 2. Product Overview
# ──────────────────────────────────────────────

@router.get(
    "/product-overview",
    response_model=ProductOverviewResponse,
    summary="Get Read-only Product Identity & Strategic Alignment",
)
def get_product_overview(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.get_product_overview(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 3. Business Objectives
# ──────────────────────────────────────────────

@router.get(
    "/objectives",
    response_model=List[BusinessObjectiveItem],
    summary="List Strategic Business Objectives",
)
def list_business_objectives(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_business_objectives(workspace_id=workspace_id)


@router.get(
    "/objectives/{objective_id}",
    response_model=BusinessObjectiveItem,
    summary="Get Business Objective Details & Evidence of Progress",
)
def get_objective_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    objective_id: str = Path(..., description="Objective ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.get_objective_detail(workspace_id=workspace_id, objective_id=objective_id)


# ──────────────────────────────────────────────
# 4. Roadmap & Initiative Portfolio
# ──────────────────────────────────────────────

@router.get(
    "/roadmap",
    response_model=List[RoadmapInitiativeItem],
    summary="List Strategic Initiatives & Roadmap",
)
def get_roadmap_portfolio(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.get_roadmap_portfolio(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 5. Pending Approvals & Formal Decisions
# ──────────────────────────────────────────────

@router.get(
    "/approvals",
    response_model=List[ApprovalRequestItem],
    summary="List Pending & Historical Approval Requests",
)
def list_approval_requests(
    workspace_id: str = Path(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED)"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_approval_requests(workspace_id=workspace_id, status=status)


@router.get(
    "/approvals/{request_id}",
    response_model=ApprovalRequestItem,
    summary="Get Approval Request Detail with Evidence & Impact",
)
def get_approval_request_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    request_id: str = Path(..., description="Approval Request ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.get_approval_request_detail(workspace_id=workspace_id, request_id=request_id)


@router.post(
    "/approvals/{request_id}/decision",
    response_model=Dict[str, Any],
    summary="Submit Authorized Business Decision (Approve / Reject / Changes)",
)
def submit_decision(
    workspace_id: str = Path(..., description="Workspace ID"),
    request_id: str = Path(..., description="Approval Request ID"),
    payload: DecisionSubmitRequest = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.APPROVE_DECISION)
    user_email = current_user.get("email") or "stakeholder@prodai.io"
    user_name = current_user.get("name") or "Business Owner"
    return stakeholder_service.submit_decision(
        workspace_id=workspace_id,
        request_id=request_id,
        decision_data=payload.model_dump(),
        user_email=user_email,
        user_name=user_name,
    )


@router.get(
    "/decisions",
    response_model=List[DecisionRecordItem],
    summary="List Immutable Business Decision Audit History",
)
def list_decision_history(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_DECISIONS)
    return stakeholder_service.list_decision_history(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 6. PRD Business Review & Feedback
# ──────────────────────────────────────────────

@router.get(
    "/prd-review/{prd_id}",
    response_model=Dict[str, Any],
    summary="Get PRD Business Justification & Review Checklist",
)
def get_prd_business_review(
    workspace_id: str = Path(..., description="Workspace ID"),
    prd_id: str = Path(..., description="PRD ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.get_prd_business_review(workspace_id=workspace_id, prd_id=prd_id)


@router.get(
    "/feedback",
    response_model=List[StakeholderFeedbackItem],
    summary="List Structured Business Feedback Items",
)
def list_business_feedback(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_business_feedback(workspace_id=workspace_id)


@router.post(
    "/feedback",
    response_model=StakeholderFeedbackItem,
    summary="Submit Structured Business Feedback",
)
def submit_business_feedback(
    workspace_id: str = Path(..., description="Workspace ID"),
    payload: StakeholderFeedbackCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.SUBMIT_BUSINESS_FEEDBACK)
    user_email = current_user.get("email") or "stakeholder@prodai.io"
    user_name = current_user.get("name") or "Business Owner"
    return stakeholder_service.submit_business_feedback(
        workspace_id=workspace_id,
        feedback_data=payload.model_dump(),
        user_email=user_email,
        user_name=user_name,
    )


@router.post(
    "/feedback/{feedback_id}/respond",
    response_model=Dict[str, Any],
    summary="PM Authoritative Response to Stakeholder Feedback",
)
def respond_to_feedback(
    workspace_id: str = Path(..., description="Workspace ID"),
    feedback_id: str = Path(..., description="Feedback ID"),
    payload: PMFeedbackResponseSubmit = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    pm_name = current_user.get("name") or "Product Manager"
    return stakeholder_service.respond_to_feedback(
        workspace_id=workspace_id,
        feedback_id=feedback_id,
        response_text=payload.response,
        status=payload.status,
        pm_name=pm_name,
    )


# ──────────────────────────────────────────────
# 7. Milestones & Progress
# ──────────────────────────────────────────────

@router.get(
    "/milestones",
    response_model=List[MilestoneItem],
    summary="List Business Milestones and Delivery Progress",
)
def list_milestones(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_milestones(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 8. Business Impact & Success Metrics
# ──────────────────────────────────────────────

@router.get(
    "/metrics",
    response_model=List[BusinessMetricItem],
    summary="List Business Impact & Success Metrics",
)
def list_business_metrics(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_BUSINESS_METRICS)
    return stakeholder_service.list_business_metrics(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 9. Risks & Dependencies
# ──────────────────────────────────────────────

@router.get(
    "/risks",
    response_model=Dict[str, Any],
    summary="List Business Risks & Dependencies Register",
)
def list_risks_and_dependencies(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_risks_and_dependencies(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 10. Notifications
# ──────────────────────────────────────────────

@router.get(
    "/notifications",
    response_model=List[StakeholderNotificationItem],
    summary="List Stakeholder Actionable Notifications",
)
def list_notifications(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.list_notifications(workspace_id=workspace_id)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=Dict[str, Any],
    summary="Mark Notification as Read",
)
def mark_notification_read(
    workspace_id: str = Path(..., description="Workspace ID"),
    notification_id: str = Path(..., description="Notification ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return stakeholder_service.mark_notification_read(workspace_id=workspace_id, notification_id=notification_id)

