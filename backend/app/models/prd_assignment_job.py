"""
prd_assignment_job.py
---------------------
MongoDB Document Models for Asynchronous PRD Assignment Analysis Jobs & Recommendations.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid

from app.core.constants import AssignmentJobStage, JobStatus


class PRDAssignmentJobModel:
    """Model for prd_assignment_jobs MongoDB collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        prd_ids: List[str],
        category_id: Optional[str] = None,
        created_by: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        jid = job_id or f"ASSIGN-JOB-{uuid.uuid4().hex[:8].upper()}"

        return {
            "job_id": jid,
            "workspace_id": str(workspace_id),
            "category_id": str(category_id or ""),
            "prd_ids": [str(pid) for pid in prd_ids],
            "status": JobStatus.QUEUED.value,
            "stage": AssignmentJobStage.QUEUED.value,
            "total_requirements": 0,
            "processed_requirements": 0,
            "progress": 0,
            "recommendations": [],
            "created_by": str(created_by or "SYSTEM"),
            "created_at": now,
            "completed_at": None,
            "error": None,
        }


class PRDAssignmentRecommendationModel:
    """Model for individual AI assignment recommendation records."""

    @staticmethod
    def create_document(
        job_id: str,
        workspace_id: str,
        prd_id: str,
        requirement_id: str,
        recommended_members: List[Dict[str, Any]],
        requirement_title: Optional[str] = None,
        requirement_type: Optional[str] = None,
        feature_id: Optional[str] = None,
        status: str = "PENDING_REVIEW",  # "PENDING_REVIEW", "ACCEPTED", "REJECTED", "EDITED"
        recommendation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        rec_id = recommendation_id or f"REC-{uuid.uuid4().hex[:8].upper()}"

        return {
            "recommendation_id": rec_id,
            "job_id": str(job_id),
            "workspace_id": str(workspace_id),
            "prd_id": str(prd_id),
            "feature_id": str(feature_id or ""),
            "requirement_id": str(requirement_id),
            "requirement_title": str(requirement_title or ""),
            "requirement_type": str(requirement_type or "FUNCTIONAL"),
            "recommended_members": recommended_members,
            "status": status,
            "created_at": now,
            "updated_at": now,
        }

