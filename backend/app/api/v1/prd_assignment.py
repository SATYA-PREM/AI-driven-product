"""
prd_assignment.py
-----------------
FastAPI Routes for PRD Team Assignments, Async AI Analysis Jobs & Downstream Handoff.
"""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Path

from app.schemas.prd_assignment import (
    TeamMemberResponse,
    AssignmentItem,
    AssignmentCreate,
    BatchAssignmentCreate,
    AssignmentUpdate,
    AssignmentJobCreate,
    AssignmentJobResponse,
    RecommendationResponse,
    AssignmentSummaryResponse,
    AssignmentHistoryItem,
    MemberResponseSubmit,
    TeamRoleProgress,
    TeamResponsesOverview,
    PMReviewActionRequest,
    ReassignActionRequest,
    ResolutionAuditResponse,
)
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.prd_assignment_service import prd_assignment_service
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(tags=["10. Milestone 4 - PRD Assignments & Team Handoff"])


# ──────────────────────────────────────────────
# 1. Team Members & Workspace Roster
# ──────────────────────────────────────────────

@router.get(
    "/workspaces/{workspace_id}/team-members",
    response_model=List[TeamMemberResponse],
    summary="Get Workspace Team Members with Product Roles",
)
def get_workspace_team_members(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    members = prd_assignment_service.get_workspace_team_members(workspace_id)
    return members


# ──────────────────────────────────────────────
# 2. Async AI Assignment Jobs & Recommendations
# ──────────────────────────────────────────────

@router.post(
    "/workspaces/{workspace_id}/prd-assignment/jobs",
    response_model=AssignmentJobResponse,
    summary="Create Async PRD Assignment Analysis Job",
)
def create_assignment_job(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: AssignmentJobCreate = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "PM User"
    job = prd_assignment_service.create_assignment_job(
        workspace_id=workspace_id,
        prd_ids=body.prd_ids,
        category_id=body.category_id,
        created_by=user_name,
    )
    return job


@router.post(
    "/prds/{prd_id}/assignment-job",
    response_model=AssignmentJobResponse,
    summary="Trigger Assignment Job for Single PRD",
)
def create_single_prd_assignment_job(
    prd_id: str = Path(..., description="PRD ID"),
    workspace_id: str = Query(..., description="Workspace ID"),
    category_id: Optional[str] = Query(None, description="Category ID"),
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "PM User"
    job = prd_assignment_service.create_assignment_job(
        workspace_id=workspace_id,
        prd_ids=[prd_id],
        category_id=category_id,
        created_by=user_name,
    )
    return job


@router.get(
    "/prd-assignment/jobs/{job_id}",
    response_model=AssignmentJobResponse,
    summary="Poll Assignment Job Status and Progress",
)
def get_assignment_job(
    job_id: str = Path(..., description="Job ID"),
    current_user=Depends(get_current_user),
):
    job = prd_assignment_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    # Attach recommendations
    recs = prd_assignment_service.get_recommendations_by_job(job_id)
    job_dict = dict(job)
    job_dict["recommendations"] = recs
    return job_dict


@router.get(
    "/prds/{prd_id}/assignment-recommendations",
    response_model=List[RecommendationResponse],
    summary="Get AI Assignment Recommendations for a PRD",
)
def get_prd_recommendations(
    prd_id: str = Path(..., description="PRD ID"),
    current_user=Depends(get_current_user),
):
    recs = prd_assignment_service.get_recommendations_for_prd(prd_id)
    return recs


@router.post(
    "/prd-assignments/recommendations/{recommendation_id}/accept",
    summary="Accept AI Recommendation",
)
def accept_recommendation(
    recommendation_id: str = Path(..., description="Recommendation ID"),
    workspace_id: str = Query(..., description="Workspace ID"),
    prd_id: str = Query(..., description="PRD ID"),
    requirement_id: str = Query(..., description="Requirement ID"),
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    try:
        created = prd_assignment_service.accept_recommendation(
            workspace_id=workspace_id,
            prd_id=prd_id,
            requirement_id=requirement_id,
            recommendation_id=recommendation_id,
            assigned_by=user_name,
        )
        return {"success": True, "created_count": len(created), "assignments": serialize_documents(created)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/prd-assignments/recommendations/{recommendation_id}/reject",
    response_model=SuccessResponse,
    summary="Reject AI Recommendation",
)
def reject_recommendation(
    recommendation_id: str = Path(..., description="Recommendation ID"),
    reason: Optional[str] = Query(None, description="Rejection reason"),
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    success = prd_assignment_service.reject_recommendation(
        recommendation_id=recommendation_id,
        rejected_by=user_name,
        reason=reason,
    )
    return SuccessResponse(success=success, message="Recommendation rejected")


# ──────────────────────────────────────────────
# 3. Assignments Management (List, Manual, Reassign, Delete)
# ──────────────────────────────────────────────

@router.get(
    "/workspaces/{workspace_id}/prd-assignments",
    response_model=List[AssignmentItem],
    summary="List Assignments for Workspace",
)
def list_workspace_assignments(
    workspace_id: str = Path(..., description="Workspace ID"),
    prd_ids: Optional[List[str]] = Query(None, description="Filter by PRD IDs"),
    category_id: Optional[str] = Query(None, description="Filter by Category"),
    user_id: Optional[str] = Query(None, description="Filter by User ID"),
    status: Optional[str] = Query(None, description="Filter by Status"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.list_assignments(
        workspace_id=workspace_id,
        prd_ids=prd_ids,
        category_id=category_id,
        user_id=user_id,
        status=status,
    )


@router.get(
    "/prds/{prd_id}/assignments",
    response_model=List[AssignmentItem],
    summary="List Assignments for a Single PRD",
)
def list_prd_assignments(
    prd_id: str = Path(..., description="PRD ID"),
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.list_assignments(
        workspace_id=workspace_id,
        prd_ids=[prd_id],
    )


@router.get(
    "/workspaces/{workspace_id}/prd-assignments/summary",
    response_model=AssignmentSummaryResponse,
    summary="Get Assignment Summary Metrics for Selected PRDs",
)
def get_assignment_summary(
    workspace_id: str = Path(..., description="Workspace ID"),
    prd_ids: List[str] = Query(..., description="Selected PRD IDs"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.get_assignment_summary(
        workspace_id=workspace_id,
        prd_ids=prd_ids,
    )


@router.post(
    "/prd-assignments",
    summary="Create Manual Requirement Assignment",
)
def create_manual_assignment(
    body: BatchAssignmentCreate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    created = prd_assignment_service.create_manual_assignment(
        workspace_id=workspace_id,
        prd_id=body.prd_id,
        requirement_id=body.requirement_id,
        assignments=[m.model_dump() for m in body.assignments],
        assigned_by=user_name,
        feature_id=body.feature_id,
        category_id=body.category_id,
    )
    return {"success": True, "created_count": len(created), "assignments": serialize_documents(created)}


@router.patch(
    "/prd-assignments/{assignment_id}",
    summary="Reassign or Update Requirement Assignment",
)
def update_assignment(
    assignment_id: str = Path(..., description="Assignment ID"),
    body: AssignmentUpdate = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    if not body.user_id:
        raise HTTPException(status_code=400, detail="New user_id is required for reassignment")

    updated = prd_assignment_service.reassign(
        assignment_id=assignment_id,
        new_user_id=body.user_id,
        team_role=body.team_role,
        reassigned_by=user_name,
        reason=body.reason,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True, "assignment": serialize_document(updated)}


@router.delete(
    "/prd-assignments/{assignment_id}",
    response_model=SuccessResponse,
    summary="Remove Requirement Assignment",
)
def delete_assignment(
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Priya Sharma (PM)"
    deleted = prd_assignment_service.remove_assignment(assignment_id, removed_by=user_name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return SuccessResponse(success=True, message="Assignment removed successfully")


@router.get(
    "/prd-assignments/history",
    response_model=List[AssignmentHistoryItem],
    summary="Get Assignment Audit History",
)
def get_assignment_history(
    assignment_id: Optional[str] = Query(None, description="Assignment ID"),
    requirement_id: Optional[str] = Query(None, description="Requirement ID"),
    prd_id: Optional[str] = Query(None, description="PRD ID"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.get_history(
        assignment_id=assignment_id,
        requirement_id=requirement_id,
        prd_id=prd_id,
    )


# ──────────────────────────────────────────────
# 4. Member Workspace & Response Submission
# ──────────────────────────────────────────────

@router.get(
    "/workspaces/{workspace_id}/prd-assignments/my",
    response_model=List[AssignmentItem],
    summary="Get Assignments for Current Logged-in Member",
)
def get_my_assignments(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    role = current_user.get("role") or ""
    email = current_user.get("email") or ""
    return prd_assignment_service.get_my_assignments(
        workspace_id=workspace_id,
        user_id=user_id,
        user_role=role,
        email=email,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_id}/prd-assignments/{assignment_id}/detail",
    response_model=AssignmentItem,
    summary="Get Enriched Assignment Detail with Context and Acceptance Criteria",
)
def get_assignment_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    detail = prd_assignment_service.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return detail


@router.post(
    "/workspaces/{workspace_id}/prd-assignments/{assignment_id}/response",
    response_model=AssignmentItem,
    summary="Submit Member Response & Status Update",
)
def submit_member_response(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: MemberResponseSubmit = ...,
    current_user=Depends(get_current_user),
):
    user_name = current_user.get("name") or current_user.get("email") or "Team Member"
    updated = prd_assignment_service.submit_member_response(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
        current_user=current_user,
        status=body.status,
        response=body.response,
        blocker_comment=body.blocker_comment,
        submitted_by=user_name,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return updated


@router.get(
    "/workspaces/{workspace_id}/prd-assignments/team-responses",
    response_model=TeamResponsesOverview,
    summary="Get Team Responses Overview and Completion Rates for PM",
)
def get_team_responses_overview(
    workspace_id: str = Path(..., description="Workspace ID"),
    prd_ids: Optional[List[str]] = Query(None, description="Filter by PRD IDs"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.get_team_responses_overview(
        workspace_id=workspace_id,
        prd_ids=prd_ids,
    )


@router.post(
    "/workspaces/{workspace_id}/prd-assignments/{assignment_id}/review",
    response_model=AssignmentItem,
    summary="PM Review Action: Accept or Reject Member Response",
)
def review_member_response(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: PMReviewActionRequest = ...,
    current_user=Depends(get_current_user),
):
    reviewer_name = body.reviewer or current_user.get("name") or current_user.get("email") or "Product Manager"
    try:
        updated = prd_assignment_service.review_member_response(
            workspace_id=workspace_id,
            assignment_id=assignment_id,
            action=body.action,
            reviewer_name=reviewer_name,
            notes=body.notes,
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/workspaces/{workspace_id}/prd-assignments/{assignment_id}/reassign",
    response_model=AssignmentItem,
    summary="PM Reassign Action: Transfer Assignment to Another Team Member",
)
def reassign_member_task(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    body: ReassignActionRequest = ...,
    current_user=Depends(get_current_user),
):
    reassigned_by = current_user.get("name") or current_user.get("email") or "Product Manager"
    updated = prd_assignment_service.reassign(
        assignment_id=assignment_id,
        new_user_id=body.new_user_id,
        team_role=body.team_role,
        reassigned_by=reassigned_by,
        reason=body.reason,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Assignment not found or reassign failed")
    detail = prd_assignment_service.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)
    return detail or updated


@router.get(
    "/workspaces/{workspace_id}/resolution-audit",
    response_model=ResolutionAuditResponse,
    summary="Problem Tasks Queue, Features Added/Removed & Issues Fixed Audit",
)
def get_resolution_audit(
    workspace_id: str = Path(..., description="Workspace ID"),
    dataset_id: Optional[str] = Query(None, description="Dataset batch filter"),
    source_type: Optional[str] = Query(None, description="Source type filter"),
    current_user=Depends(get_current_user),
):
    return prd_assignment_service.get_resolution_audit(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        source_type=source_type,
    )


