"""
designer.py
-----------
Pydantic Schemas for Product Designer Workspaces, UX Requirements & Design Responses.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DesignResponseSubmit(BaseModel):
    status: str = Field(..., description="NOT_STARTED | IN_PROGRESS | COMPLETED | BLOCKED")
    response: str = Field(..., min_length=1, description="UX specifications, interaction guidelines, or review notes")
    figma_url: Optional[str] = Field(None, description="Figma design or prototype URL")
    prototype_url: Optional[str] = Field(None, description="Interactive prototype or asset link")
    blocker_comment: Optional[str] = Field(None, description="Blocker explanation if status is BLOCKED")


class DesignerTaskItem(BaseModel):
    assignment_id: str
    workspace_id: str
    prd_id: str
    prd_title: str = ""
    prd_version: str = "v1.0"
    requirement_id: str
    requirement_title: str = ""
    requirement_description: str = ""
    requirement_type: str = "FUNCTIONAL"
    status: str = "NOT_STARTED"
    assigned_by: str = ""
    assigned_at: Optional[str] = None
    problem_statement: Any = ""
    customer_impact: Any = ""
    supporting_insights: List[Any] = []
    acceptance_criteria: List[Any] = []
    user_stories: List[Any] = []
    role_responsibility: str = ""
    response: Optional[str] = None
    figma_url: Optional[str] = None
    prototype_url: Optional[str] = None
    blocker_comment: Optional[str] = None
    submitted_at: Optional[str] = None
    submitted_by: Optional[str] = None


class DesignerDashboardResponse(BaseModel):
    workspace_id: str
    workspace_name: str = ""
    product_name: str = ""
    total_assigned: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0
    blocked_count: int = 0
    recent_tasks: List[DesignerTaskItem] = []
    role_guidance: str = ""


class UXRequirementDetail(BaseModel):
    assignment_id: Optional[str] = None
    requirement_id: str
    requirement_title: str
    prd_id: str
    prd_title: str
    prd_version: str
    category: str
    status: str
    priority: str = "HIGH"
    problem_statement: Any = ""
    customer_impact: Any = ""
    interaction_flow: str = ""
    ui_states: Dict[str, str] = {}
    accessibility_criteria: List[Any] = []
    acceptance_criteria: List[Any] = []
    customer_quotes: List[Any] = []
    figma_url: Optional[str] = None
    response: Optional[str] = None
    blocker_comment: Optional[str] = None


class DesignerProductContextResponse(BaseModel):
    workspace_id: str
    workspace_name: str
    product_name: str = ""
    product_type: str = ""
    target_audience: str = ""
    core_problem_statement: str = ""
    key_user_journeys: List[str] = []
    top_customer_pain_points: List[Dict[str, Any]] = []
    strategic_design_goals: List[str] = []
    active_prds_count: int = 0


class DesignerCustomerFeedbackItem(BaseModel):
    feedback_id: str
    title: str
    content: str
    sentiment: str = "neutral"
    category: str = "General"
    ux_impact: str = "High"
    user_type: str = "Customer"
    source: str = "In-App Feedback"
    created_at: Optional[str] = None

