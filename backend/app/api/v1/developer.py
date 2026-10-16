"""
developer.py
------------
FastAPI routes for Developer Workspace:
- Developer Dashboard with 5 KPI counts
- Assignments list and detailed requirement views
- Implementation submissions with revision snapshots
- Defect tracking and fix workflow
- Blockers and clarification requests
- Approved design handoff views
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status

from app.schemas.developer import (
    DeveloperDashboardResponse,
    DeveloperAssignmentSummary,
    ImplementationSubmissionCreate,
    ImplementationSubmissionResponse,
    DefectItem,
    DefectFixSubmit,
    BlockerCreate,
    ClarificationCreate,
    DesignHandoffItem,
)
from app.middleware.auth_middleware import get_current_user
from app.services.developer_service import developer_service
from app.services.auth.permission_service import permission_service
from app.core.constants import Permission

router = APIRouter(
    prefix="/workspaces/{workspace_id}/developer",
    tags=["15. Developer Workspace"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/dashboard",
    response_model=DeveloperDashboardResponse,
    summary="Get Developer Dashboard Overview and KPI metrics",
)
def get_developer_dashboard(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return developer_service.get_dashboard(workspace_id=workspace_id, user_id=user_id, email=email)


@router.get(
    "/assignments",
    response_model=List[DeveloperAssignmentSummary],
    summary="List all development tasks for current developer",
)
def list_developer_assignments(
    workspace_id: str = Path(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return developer_service.get_assignments(workspace_id=workspace_id, user_id=user_id, email=email, status=status)


@router.get(
    "/assignments/{assignment_id}",
    response_model=Dict[str, Any],
    summary="Get single assignment detail with requirements, criteria, and submissions",
)
def get_assignment_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return developer_service.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)


@router.patch(
    "/assignments/{assignment_id}/status",
    response_model=Dict[str, Any],
    summary="Update assignment progress status",
)
def update_assignment_status(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    status: str = Query(..., description="New status"),
    notes: Optional[str] = Query(None, description="Progress notes"),
    blocker_comment: Optional[str] = Query(None, description="Blocker details if status is BLOCKED"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "Developer"
    return developer_service.update_assignment_status(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
        new_status=status,
        user_name=user_name,
        notes=notes,
        blocker_comment=blocker_comment,
    )


@router.post(
    "/submissions",
    response_model=ImplementationSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit implementation work for review or QA",
)
def submit_implementation(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: ImplementationSubmissionCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "Developer"
    return developer_service.submit_implementation(
        workspace_id=workspace_id,
        payload=body.model_dump(),
        user_name=user_name,
    )


@router.get(
    "/defects",
    response_model=List[DefectItem],
    summary="List defects associated with development tasks",
)
def list_defects(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: Optional[str] = Query(None, description="Filter by assignment ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return developer_service.get_defects(workspace_id=workspace_id, assignment_id=assignment_id)


@router.post(
    "/defects/{defect_id}/fix",
    response_model=DefectItem,
    summary="Submit fix details for a defect",
)
def submit_defect_fix(
    workspace_id: str = Path(..., description="Workspace ID"),
    defect_id: str = Path(..., description="Defect ID"),
    body: DefectFixSubmit = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "Developer"
    return developer_service.submit_defect_fix(
        workspace_id=workspace_id,
        defect_id=defect_id,
        payload=body.model_dump(),
        user_name=user_name,
    )


@router.post(
    "/blockers",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Report an execution blocker on a task",
)
def report_blocker(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: BlockerCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "Developer"
    return developer_service.create_blocker(
        workspace_id=workspace_id,
        payload=body.model_dump(),
        user_name=user_name,
    )


@router.post(
    "/clarifications",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a requirement clarification request to the PM",
)
def request_clarification(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: ClarificationCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "Developer"
    return developer_service.create_clarification(
        workspace_id=workspace_id,
        payload=body.model_dump(),
        user_name=user_name,
    )


@router.get(
    "/design-handoffs",
    response_model=List[DesignHandoffItem],
    summary="Get approved design handoffs, interaction specs, and prototypes",
)
def get_design_handoffs(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return developer_service.get_design_handoffs(workspace_id=workspace_id)

