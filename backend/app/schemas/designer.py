"""
designer.py
-----------
Pydantic Schemas for Product Designer Workspaces, UX Requirements, Deliverables,
Drafts, Submissions, Revisions, Reviews & Blockers.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DesignDeliverableItem(BaseModel):
    deliverable_id: Optional[str] = None
    title: str = Field(..., min_length=2, description="Title of deliverable (e.g. Checkout High-Fidelity Prototype)")
    deliverable_type: str = Field("FIGMA_FILE", description="FIGMA_FILE | PROTOTYPE | WIREFRAME | SPECIFICATION | USER_FLOW | ASSET")
    url: str = Field(..., description="Valid external URL (https://...)")
    description: Optional[str] = Field(None, description="Notes on artboards, flow details or components")


class DesignResponseSubmit(BaseModel):
    status: str = Field(..., description="NOT_STARTED | IN_PROGRESS | SUBMITTED_FOR_REVIEW | COMPLETED | BLOCKED")
    response: str = Field(..., min_length=1, description="UX specifications, interaction guidelines, or review notes")
    figma_url: Optional[str] = Field(None, description="Figma design or prototype URL")
    prototype_url: Optional[str] = Field(None, description="Interactive prototype or asset link")
    deliverables: Optional[List[DesignDeliverableItem]] = Field(default_factory=list, description="Array of deliverables")
    handoff_notes: Optional[str] = Field(None, description="Handoff notes for engineering and QA")
    accessibility_notes: Optional[str] = Field(None, description="Accessibility compliance notes")
    responsive_notes: Optional[str] = Field(None, description="Mobile / Tablet / Desktop breakpoint notes")
    blocker_comment: Optional[str] = Field(None, description="Blocker explanation if status is BLOCKED")
    is_draft: bool = Field(False, description="Whether this is saved as a draft")
    revision_response: Optional[str] = Field(None, description="Response to reviewer's change requests")


class DesignReviewCreate(BaseModel):
    decision: str = Field(..., description="APPROVED | REVISION_REQUESTED | REJECTED")
    comments: str = Field(..., min_length=2, description="PM review feedback and critique")
    criteria_feedback: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Feedback per criterion")
    revision_deadline: Optional[str] = None


class BlockerCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    category: str = Field("MISSING_REQUIREMENTS", description="MISSING_REQUIREMENTS | CONFLICTING_REQUIREMENTS | MISSING_CUSTOMER_CONTEXT | TECHNICAL_DEPENDENCY | ACCESS_PERMISSIONS | OTHER")
    impact: str = Field("HIGH", description="CRITICAL | HIGH | MEDIUM | LOW")
    supporting_link: Optional[str] = None
    requested_assistance: Optional[str] = None


class ClarificationCreate(BaseModel):
    question: str = Field(..., min_length=5)
    context_notes: Optional[str] = None
    priority: str = Field("MEDIUM", description="URGENT | HIGH | MEDIUM | LOW")


class DesignerTaskItem(BaseModel):
    assignment_id: str
    workspace_id: str
    prd_id: str
    prd_title: str = ""
    prd_version: str = "v1.0"
    requirement_id: str
    requirement_title: str = ""
    requirement_description: str = ""
    requirement_type: str = "USER_EXPERIENCE"
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
    deliverables: List[DesignDeliverableItem] = []
    handoff_notes: Optional[str] = None
    accessibility_notes: Optional[str] = None
    responsive_notes: Optional[str] = None
    blocker_comment: Optional[str] = None
    submitted_at: Optional[str] = None
    submitted_by: Optional[str] = None
    review_status: Optional[str] = None  # PENDING | APPROVED | REVISION_REQUESTED
    review_comments: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    revision_count: int = 0
    is_draft: bool = False
    priority: str = "HIGH"
    raw_data_quotes: List[str] = []


class DesignerDashboardResponse(BaseModel):
    workspace_id: str
    workspace_name: str = ""
    product_name: str = ""
    total_assigned: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0
    blocked_count: int = 0
    review_requested_count: int = 0
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
    prototype_url: Optional[str] = None
    deliverables: List[DesignDeliverableItem] = []
    response: Optional[str] = None
    handoff_notes: Optional[str] = None
    blocker_comment: Optional[str] = None
    review_status: Optional[str] = None
    review_comments: Optional[str] = None


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


class DesignSubmissionSnapshot(BaseModel):
    submission_id: str
    assignment_id: str
    workspace_id: str
    revision_number: int = 1
    submitted_by: str
    submitted_at: str
    prd_id: str
    prd_version: str
    response: str
    figma_url: Optional[str] = None
    prototype_url: Optional[str] = None
    deliverables: List[DesignDeliverableItem] = []
    handoff_notes: Optional[str] = None
    accessibility_notes: Optional[str] = None
    responsive_notes: Optional[str] = None
    review_status: str = "PENDING_REVIEW"
    review_comments: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None


