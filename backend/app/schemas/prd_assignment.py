"""
prd_assignment.py
-----------------
Pydantic Schemas for PRD Assignments, Jobs, Recommendations & Downstream Handoff.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.constants import ProductTeamRole, AssignmentStatus, AssignmentMethod


class TeamMemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    team_role: str
    role_title: str
    avatar: Optional[str] = None
    is_active: bool = True


class RecommendedMemberItem(BaseModel):
    user_id: str
    user_name: Optional[str] = None
    role: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.85)


class RecommendationResponse(BaseModel):
    recommendation_id: str
    job_id: str
    workspace_id: str
    prd_id: str
    feature_id: Optional[str] = ""
    requirement_id: str
    requirement_title: Optional[str] = ""
    requirement_type: Optional[str] = "FUNCTIONAL"
    recommended_members: List[RecommendedMemberItem] = []
    status: str = "PENDING_REVIEW"
    created_at: Optional[str] = None


class AssignmentItem(BaseModel):
    assignment_id: str
    workspace_id: str
    category_id: Optional[str] = ""
    prd_id: str
    prd_title: Optional[str] = ""
    prd_version: Optional[str] = "v1.0"
    feature_id: Optional[str] = ""
    feature_title: Optional[str] = ""
    requirement_id: str
    requirement_title: Optional[str] = ""
    requirement_type: Optional[str] = "FUNCTIONAL"
    user_id: str
    user_name: Optional[str] = ""
    user_email: Optional[str] = ""
    user_avatar: Optional[str] = ""
    team_role: str
    assignment_method: str
    ai_recommendation_id: Optional[str] = ""
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = ""
    status: str
    assigned_by: Optional[str] = ""
    assigned_at: Optional[str] = None
    updated_at: Optional[str] = None


class AssignmentCreate(BaseModel):
    prd_id: str
    requirement_id: str
    user_id: str
    team_role: str
    feature_id: Optional[str] = None
    category_id: Optional[str] = None
    prd_version: Optional[str] = "v1.0"
    assignment_method: Optional[str] = "MANUAL"
    ai_recommendation_id: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None


class BatchAssignmentMember(BaseModel):
    user_id: str
    team_role: str
    reason: Optional[str] = None


class BatchAssignmentCreate(BaseModel):
    prd_id: str
    requirement_id: str
    feature_id: Optional[str] = None
    category_id: Optional[str] = None
    assignments: List[BatchAssignmentMember]
    assignment_method: Optional[str] = "MANUAL"
    ai_recommendation_id: Optional[str] = None


class AssignmentUpdate(BaseModel):
    user_id: Optional[str] = None
    team_role: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None


class AssignmentJobCreate(BaseModel):
    prd_ids: List[str]
    category_id: Optional[str] = None


class AssignmentJobResponse(BaseModel):
    job_id: str
    workspace_id: str
    category_id: Optional[str] = ""
    prd_ids: List[str]
    status: str
    stage: str
    total_requirements: int = 0
    processed_requirements: int = 0
    progress: int = 0
    recommendations: List[Dict[str, Any]] = []
    created_by: Optional[str] = ""
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None


class AssignmentSummaryResponse(BaseModel):
    selected_prds_count: int = 0
    total_requirements: int = 0
    assigned_requirements: int = 0
    unassigned_requirements: int = 0
    role_breakdown: Dict[str, int] = {}
    status_breakdown: Dict[str, int] = {}


class AssignmentHistoryItem(BaseModel):
    history_id: str
    assignment_id: str
    requirement_id: str
    prd_id: str
    action: str
    previous_user_id: Optional[str] = None
    previous_user_name: Optional[str] = None
    new_user_id: Optional[str] = None
    new_user_name: Optional[str] = None
    team_role: Optional[str] = None
    method: Optional[str] = None
    reason: Optional[str] = None
    changed_by: Optional[str] = None
    timestamp: str

