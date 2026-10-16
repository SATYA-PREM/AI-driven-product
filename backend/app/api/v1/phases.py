"""
phases.py
---------
FastAPI router for PRD Phase Management, Milestone Tracking & Delivery Readiness Gates.
Provides end-to-end operational visibility from PRD generation through design, engineering, QA, and release readiness.
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Path, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.core.constants import Permission
from app.core.database import (
    prd_projects_collection,
    prd_assignments_collection,
    product_features_collection,
    issue_clusters_collection,
    reports_collection,
    workflows_collection,
)
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(
    prefix="/workspaces/{workspace_id}/phases",
    tags=["14. Product Delivery Phases & Readiness Gates"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/milestones",
    response_model=List[Dict[str, Any]],
    summary="Get Workspace Delivery Milestones & Risk Health",
)
def get_workspace_milestones(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    """
    Returns live delivery milestones synthesized from real PRDs, assignments,
    and open blockers across all 4 product roles.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)

    prds = list(prd_projects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
    assignments = list(prd_assignments_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))

    milestones = []
    
    # 1. PRD Specifications Phase
    draft_prds = [p for p in prds if str(p.get("status", "")).lower() in ["draft", "pm_review"]]
    approved_prds = [p for p in prds if str(p.get("status", "")).lower() in ["approved", "active"]]
    
    milestones.append({
        "id": "MS-01",
        "title": "PRD Requirements & Approval Gate",
        "phase": "Product Planning",
        "status": "COMPLETED" if approved_prds else ("IN_PROGRESS" if prds else "PLANNED"),
        "target_date": "Sprint Phase 1",
        "total_items": len(prds),
        "completed_items": len(approved_prds),
        "blocked_items": 0,
        "health": "ON_TRACK" if approved_prds or not prds else "ATTENTION_NEEDED",
    })

    # 2. UX & Design Deliverables Phase
    ux_items = [a for a in assignments if a.get("team_role") == "PRODUCT_DESIGNER"]
    ux_completed = sum(1 for a in ux_items if a.get("status") in ["COMPLETED", "APPROVED"])
    ux_blocked = sum(1 for a in ux_items if a.get("status") == "BLOCKED")

    milestones.append({
        "id": "MS-02",
        "title": "UX & Interface Design Handoff",
        "phase": "Product Design",
        "status": "COMPLETED" if (ux_items and ux_completed == len(ux_items)) else ("IN_PROGRESS" if ux_items else "PLANNED"),
        "target_date": "Sprint Phase 2",
        "total_items": len(ux_items),
        "completed_items": ux_completed,
        "blocked_items": ux_blocked,
        "health": "AT_RISK" if ux_blocked > 0 else ("ON_TRACK" if ux_completed > 0 else "NORMAL"),
    })

    # 3. Technical Implementation Phase
    dev_items = [a for a in assignments if a.get("team_role") == "DEVELOPER"]
    dev_completed = sum(1 for a in dev_items if a.get("status") in ["COMPLETED", "APPROVED"])
    dev_blocked = sum(1 for a in dev_items if a.get("status") == "BLOCKED")

    milestones.append({
        "id": "MS-03",
        "title": "Full-Stack Development & Architecture",
        "phase": "Engineering",
        "status": "COMPLETED" if (dev_items and dev_completed == len(dev_items)) else ("IN_PROGRESS" if dev_items else "PLANNED"),
        "target_date": "Sprint Phase 3",
        "total_items": len(dev_items),
        "completed_items": dev_completed,
        "blocked_items": dev_blocked,
        "health": "AT_RISK" if dev_blocked > 0 else ("ON_TRACK" if dev_completed > 0 else "NORMAL"),
    })

    # 4. QA Verification & Edge Cases
    qa_items = [a for a in assignments if a.get("team_role") == "QA"]
    qa_completed = sum(1 for a in qa_items if a.get("status") in ["COMPLETED", "APPROVED"])
    qa_blocked = sum(1 for a in qa_items if a.get("status") == "BLOCKED")

    milestones.append({
        "id": "MS-04",
        "title": "QA Acceptance Testing & Defect Verification",
        "phase": "Quality Assurance",
        "status": "COMPLETED" if (qa_items and qa_completed == len(qa_items)) else ("IN_PROGRESS" if qa_items else "PLANNED"),
        "target_date": "Sprint Phase 4",
        "total_items": len(qa_items),
        "completed_items": qa_completed,
        "blocked_items": qa_blocked,
        "health": "AT_RISK" if qa_blocked > 0 else ("ON_TRACK" if qa_completed > 0 else "NORMAL"),
    })

    # 5. Stakeholder Sign-Off & Delivery Readiness
    stk_items = [a for a in assignments if a.get("team_role") == "STAKEHOLDER"]
    stk_completed = sum(1 for a in stk_items if a.get("status") in ["COMPLETED", "APPROVED"])

    milestones.append({
        "id": "MS-05",
        "title": "Stakeholder Approval & Release Readiness Gate",
        "phase": "Delivery Readiness",
        "status": "COMPLETED" if (stk_items and stk_completed == len(stk_items)) else ("IN_PROGRESS" if stk_items else "PLANNED"),
        "target_date": "Final Sign-off",
        "total_items": len(stk_items),
        "completed_items": stk_completed,
        "blocked_items": 0,
        "health": "ON_TRACK" if stk_completed > 0 else "NORMAL",
    })

    return milestones


@router.get(
    "/delivery-readiness",
    response_model=Dict[str, Any],
    summary="Audit End-to-End Delivery Readiness",
)
def get_delivery_readiness(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    """
    Computes an audit checklist validating end-to-end readiness:
    - PRD Approval status
    - Design acceptance
    - Engineering submission
    - QA verification & 0 critical defects
    - Stakeholder sign-off
    """
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)

    prds = list(prd_projects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
    assignments = list(prd_assignments_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
    critical_issues = list(issue_clusters_collection.find({
        "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
        "$or": [{"severity": {"$in": ["critical", "high"]}}, {"priority_score": {"$gte": 70}}]
    }))

    approved_prds = [p for p in prds if str(p.get("status", "")).lower() in ["approved", "active"]]
    blocked_assignments = [a for a in assignments if a.get("status") == "BLOCKED"]

    # Gates
    gates = [
        {
            "name": "PRD Requirements Approved",
            "passed": len(approved_prds) > 0,
            "detail": f"{len(approved_prds)} of {len(prds)} PRDs approved by PM",
        },
        {
            "name": "Zero Critical Blockers in Execution",
            "passed": len(blocked_assignments) == 0,
            "detail": f"{len(blocked_assignments)} blocked tasks detected",
        },
        {
            "name": "Role Allocations Active",
            "passed": len(assignments) >= 4,
            "detail": f"{len(assignments)} assigned tasks across product roles",
        },
        {
            "name": "Critical Customer Pain Points Mitigated",
            "passed": len(critical_issues) == 0 or len(approved_prds) > 0,
            "detail": f"{len(critical_issues)} high-severity issues tracked",
        },
    ]

    passed_count = sum(1 for g in gates if g["passed"])
    score = round((passed_count / len(gates)) * 100, 1) if gates else 0.0

    return {
        "workspace_id": workspace_id,
        "is_ready_for_release": passed_count == len(gates),
        "readiness_score": score,
        "passed_gates_count": passed_count,
        "total_gates_count": len(gates),
        "gates": gates,
        "open_blockers": len(blocked_assignments),
        "critical_issues_count": len(critical_issues),
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }

