"""
prd.py
------
FastAPI endpoints for Milestone 3 PRD Generation & Lifecycle Management:
- Context Package Preview & Batch PRD Generation
- Multi-collection persistence & section editing
- PM Review Approval Gates
- Requirement Decomposition to User Stories & Tasks
- Traceability & Lineage Resolution
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, Query, status

from app.schemas.prd import (
    PRDContextPreviewResponse,
    PRDGenerateRequest,
    PRDUpdateRequest,
    PRDReviewRequest,
    PRDFullResponse,
    ProvenanceTraceResponse,
    FeatureExportRequest,
)
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.prd.prd_service import prd_service
from app.core.constants import Permission
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(
    prefix="/workspaces/{workspace_id}/prd",
    tags=["9. Milestone 3 - PRD Generation & Development"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/pm-reviews",
    response_model=List[Dict[str, Any]],
    summary="List Workspace PM Reviews (Approved & Pending)",
)
def list_pm_reviews(
    workspace_id: str,
    dataset_id: Optional[str] = Query(default=None, description="Filter PM reviews by dataset ID"),
    source_type: Optional[str] = Query(default=None, description="Filter PM reviews by source type"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return prd_service.list_pm_reviews(workspace_id, dataset_id=dataset_id, source_type=source_type)


@router.post(
    "/pm-reviews/{review_id}/approve",
    response_model=Dict[str, Any],
    summary="Approve a Pending PM Review Package for PRD Generation",
)
def approve_pm_review(
    workspace_id: str,
    review_id: str,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.GENERATE_PRD)
    user_str = (current_user.get("email") if isinstance(current_user, dict) else getattr(current_user, "email", None)) or (current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)) or "Priya Sharma (PM)"
    return prd_service.approve_pm_review(workspace_id, review_id, reviewed_by=str(user_str))


@router.get(
    "/context-preview",
    response_model=PRDContextPreviewResponse,
    summary="Get Approved PM Review Context Package Preview",
    response_description="Single consolidated batch input payload constructed from PM Review data for PRD generation"
)
def get_prd_context_preview(
    workspace_id: str,
    source_review_id: str = Query(default="REV-001", description="Approved PM review identifier"),
    product_id: Optional[str] = Query(default="default-product"),
    dataset_id: Optional[str] = Query(default=None, description="Batch/Dataset scope identifier"),
    source_type: Optional[str] = Query(default=None, description="Source type filter"),
    current_user=Depends(get_current_user),
):
    """
    **Batch Context Construction (Milestone 3 Core Pipeline):**
    Aggregates all PM-approved issues, feature opportunities, evidence record IDs,
    product intelligence, and PM strategic notes into ONE structured input package.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    preview = prd_service.get_context_preview(
        workspace_id=workspace_id,
        source_review_id=source_review_id,
        product_id=product_id,
        dataset_id=dataset_id,
        source_type=source_type,
    )
    return preview


@router.post(
    "/generate",
    response_model=PRDFullResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Batch PRD from PM Review via CrewAI & Gemini",
    response_description="Complete structured PRD tree persisted across 14 collections"
)
def generate_prd_batch(
    workspace_id: str,
    payload: PRDGenerateRequest,
    current_user=Depends(get_current_user),
):
    """
    **Batch PRD Generation:**
    Passes the consolidated review context package as ONE batch input to the
    CrewAI + Gemini multi-agent workflow (Product Analyst → Requirements Analyst → PM Agent → PRD Architect).
    """
    permission_service.require_permission(current_user, workspace_id, Permission.GENERATE_PRD)
    user_str = (current_user.get("email") if isinstance(current_user, dict) else getattr(current_user, "email", None)) or (current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)) or "user_pm"
    tree = prd_service.generate_prd_from_review(
        workspace_id=workspace_id,
        source_review_id=payload.source_review_id or "REV-001",
        product_id=payload.product_id or "default-product",
        pm_comments=payload.pm_comments,
        dataset_id=payload.dataset_id,
        source_type=payload.source_type,
        selected_insight_ids=payload.selected_insight_ids,
        selected_opportunity_ids=payload.selected_opportunity_ids,
        user_id=str(user_str),
    )
    return serialize_document(tree)


@router.get(
    "/projects",
    response_model=List[Dict[str, Any]],
    summary="List PRD Projects in Workspace"
)
def list_prd_projects(
    workspace_id: str,
    dataset_id: Optional[str] = Query(default=None, description="Filter by dataset ID"),
    source_type: Optional[str] = Query(default=None, description="Filter by source type"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    from app.repositories.prd_repository import prd_repository
    projects = prd_repository.list_projects_by_workspace(workspace_id, dataset_id=dataset_id, source_type=source_type)
    return serialize_documents(projects)


@router.get(
    "/{prd_id}",
    response_model=PRDFullResponse,
    summary="Get Structured PRD Full Tree"
)
def get_prd_full_tree(
    workspace_id: str,
    prd_id: str,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    tree = prd_service.get_full_prd_tree(prd_id)
    if not tree.get("project"):
        raise NotFoundError("PRD Project", prd_id)
    return serialize_document(tree)


@router.patch(
    "/{prd_id}",
    response_model=PRDFullResponse,
    summary="Update PRD Document Sections (PM Editing)"
)
def update_prd_sections(
    workspace_id: str,
    prd_id: str,
    payload: PRDUpdateRequest,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.GENERATE_PRD)
    user_str = (current_user.get("email") if isinstance(current_user, dict) else getattr(current_user, "email", None)) or (current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)) or "user_pm"
    dump_data = payload.model_dump(exclude_none=True) if hasattr(payload, "model_dump") else payload.dict(exclude_none=True)
    tree = prd_service.update_prd_document(
        prd_id=prd_id,
        update_data=dump_data,
        user_id=str(user_str),
    )
    return serialize_document(tree)


@router.post(
    "/{prd_id}/review",
    response_model=PRDFullResponse,
    summary="Submit PM Review Gate on PRD (Approve or Request Changes)"
)
def submit_prd_pm_review_gate(
    workspace_id: str,
    prd_id: str,
    payload: PRDReviewRequest,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.GENERATE_PRD)
    tree = prd_service.submit_prd_pm_review(
        prd_id=prd_id,
        decision=payload.decision,
        comments=payload.comments or [],
        reviewed_by=payload.reviewed_by or "Priya Sharma (PM)",
    )
    return serialize_document(tree)


@router.post(
    "/{prd_id}/generate-stories",
    response_model=List[Dict[str, Any]],
    summary="Decompose Approved Requirements into User Stories & Tasks"
)
def generate_user_stories(
    workspace_id: str,
    prd_id: str,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.GENERATE_PRD)
    stories = prd_service.generate_user_stories_for_prd(prd_id)
    return serialize_documents(stories)


@router.get(
    "/{prd_id}/provenance/{item_type}/{item_id}",
    response_model=ProvenanceTraceResponse,
    summary="Trace Lineage & Evidence Chain Back to Customer Feedback"
)
def trace_item_provenance(
    workspace_id: str,
    prd_id: str,
    item_type: str,
    item_id: str,
    current_user=Depends(get_current_user),
):
    """
    **End-to-End Lineage Query:**
    Traces any requirement, user story, feature, or development task backward to its
    source insight and original customer feedback quotes.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    chain = prd_service.get_provenance_chain(prd_id=prd_id, item_type=item_type, item_id=item_id)
    return chain


@router.post(
    "/{prd_id}/circulation-package",
    response_model=Dict[str, Any],
    summary="Generate Formatted Circulation Pack for Selected Features (PDF/Print/Markdown)"
)
def generate_feature_circulation_package(
    workspace_id: str,
    prd_id: str,
    payload: FeatureExportRequest,
    current_user=Depends(get_current_user),
):
    """
    **Team Circulation Document:**
    Compiles selected features, their linked customer problem symptoms, root causes,
    functional specifications, user stories, acceptance criteria, and verbatim evidence
    into an executive circulation document for team correction and engineering review.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_str = (current_user.get("email") if isinstance(current_user, dict) else getattr(current_user, "email", None)) or (current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)) or "Product Manager"
    pkg = prd_service.build_circulation_package(
        prd_id=prd_id,
        feature_ids=payload.feature_ids,
        circulation_notes=payload.circulation_notes or "",
        reviewer_name=payload.reviewer_name or str(user_str),
    )
    return serialize_document(pkg)

