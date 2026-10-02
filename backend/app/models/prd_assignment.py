"""
prd_assignment.py
-----------------
MongoDB Document Models for PRD Requirement Team Assignments & Audit History.
Phase 4 Downstream Handoff Architecture:
  Workspace -> Category -> PRD -> Feature -> Requirement -> Assignment -> Team Member
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import uuid

from app.core.constants import ProductTeamRole, AssignmentStatus, AssignmentMethod


class PRDAssignmentModel:
    """Model for prd_assignments MongoDB collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        prd_id: str,
        requirement_id: str,
        user_id: str,
        team_role: ProductTeamRole | str,
        category_id: Optional[str] = None,
        feature_id: Optional[str] = None,
        prd_version: Optional[str] = "v1.0",
        assignment_method: AssignmentMethod | str = AssignmentMethod.MANUAL,
        ai_recommendation_id: Optional[str] = None,
        ai_confidence: Optional[float] = None,
        ai_reason: Optional[str] = None,
        status: AssignmentStatus | str = AssignmentStatus.ASSIGNED,
        assigned_by: Optional[str] = None,
        assignment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        role_val = team_role.value if hasattr(team_role, "value") else str(team_role)
        status_val = status.value if hasattr(status, "value") else str(status)
        method_val = assignment_method.value if hasattr(assignment_method, "value") else str(assignment_method)
        asn_id = assignment_id or f"ASN-{uuid.uuid4().hex[:8].upper()}"

        return {
            "assignment_id": asn_id,
            "workspace_id": str(workspace_id),
            "category_id": str(category_id) if category_id else "",
            "prd_id": str(prd_id),
            "prd_version": str(prd_version or "v1.0"),
            "feature_id": str(feature_id or ""),
            "requirement_id": str(requirement_id),
            "user_id": str(user_id),
            "team_role": role_val,
            "assignment_method": method_val,
            "ai_recommendation_id": ai_recommendation_id or "",
            "ai_confidence": float(ai_confidence) if ai_confidence is not None else None,
            "ai_reason": ai_reason or "",
            "status": status_val,
            "assigned_by": str(assigned_by or ""),
            "assigned_at": now,
            "updated_at": now,
        }


class PRDAssignmentHistoryModel:
    """Model for prd_assignment_history collection (Audit log of all assignments, changes & removals)."""

    @staticmethod
    def create_document(
        assignment_id: str,
        requirement_id: str,
        prd_id: str,
        action: str,  # "RECOMMENDED", "ACCEPTED", "REJECTED", "ASSIGNED", "REASSIGNED", "REMOVED"
        changed_by: str,
        previous_user_id: Optional[str] = None,
        new_user_id: Optional[str] = None,
        team_role: Optional[str] = None,
        method: Optional[str] = None,
        reason: Optional[str] = None,
        history_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        hid = history_id or f"HIS-{uuid.uuid4().hex[:8].upper()}"
        return {
            "history_id": hid,
            "assignment_id": str(assignment_id),
            "requirement_id": str(requirement_id),
            "prd_id": str(prd_id),
            "action": str(action),
            "previous_user_id": str(previous_user_id) if previous_user_id else None,
            "new_user_id": str(new_user_id) if new_user_id else None,
            "team_role": str(team_role or ""),
            "method": str(method or "MANUAL"),
            "reason": str(reason or ""),
            "changed_by": str(changed_by or "SYSTEM"),
            "timestamp": now,
        }

