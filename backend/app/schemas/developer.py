"""
developer.py
------------
Pydantic response and request schemas for Developer Workspace.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DeveloperKPI(BaseModel):
    assigned_tasks: int = 0
    pending: int = 0
    in_progress: int = 0
    submitted_for_review: int = 0
    blocked: int = 0
    open_defects: int = 0


class DeveloperAssignmentSummary(BaseModel):
    assignment_id: str
    workspace_id: str
    prd_id: str
    prd_title: str
    prd_version: str = "v1.0"
    requirement_id: str
    requirement_title: str
    requirement_description: str
    requirement_type: str = "TECHNICAL"
    team_role: str = "DEVELOPER"
    status: str = "IN_PROGRESS"  # NOT_STARTED | IN_PROGRESS | SUBMITTED_FOR_REVIEW | QA_PENDING | QA_IN_PROGRESS | COMPLETED | BLOCKED
    priority: str = "HIGH"
    due_date: Optional[str] = None
    assigned_by: str = "Product Manager"
    assigned_at: Optional[str] = None
    problem_statement: Optional[str] = None
    customer_impact: Optional[str] = None
    acceptance_criteria: List[str] = []
    user_stories: List[str] = []
    dependencies: List[str] = []
    technical_notes: Optional[str] = None
    api_contracts: List[str] = []
    design_reference: Optional[Dict[str, Any]] = None
    latest_submission: Optional[Dict[str, Any]] = None
    open_defects_count: int = 0
    blocker_comment: Optional[str] = None
    updated_at: Optional[str] = None


class DeveloperDashboardResponse(BaseModel):
    workspace_id: str
    kpis: DeveloperKPI
    assignments: List[DeveloperAssignmentSummary] = []
    upcoming_deadlines: List[DeveloperAssignmentSummary] = []
    recent_defects: List[Dict[str, Any]] = []
    recent_design_handoffs: List[Dict[str, Any]] = []


class ImplementationSubmissionCreate(BaseModel):
    assignment_id: str
    submission_summary: str = Field(..., min_length=3, description="High-level description of work done")
    work_completed: str = Field(..., min_length=3, description="Details of implementation")
    requirements_addressed: List[str] = Field(default_factory=list)
    implementation_notes: Optional[str] = None
    code_repository_url: Optional[str] = None
    pull_request_url: Optional[str] = None
    branch_or_commit: Optional[str] = None
    build_reference: Optional[str] = None
    known_limitations: Optional[str] = None
    test_evidence: Optional[str] = None
    is_ready_for_review: bool = True


class ImplementationSubmissionResponse(BaseModel):
    submission_id: str
    assignment_id: str
    workspace_id: str
    prd_id: str
    requirement_id: str
    revision_number: int = 1
    submission_summary: str
    work_completed: str
    requirements_addressed: List[str] = []
    implementation_notes: Optional[str] = None
    code_repository_url: Optional[str] = None
    pull_request_url: Optional[str] = None
    branch_or_commit: Optional[str] = None
    build_reference: Optional[str] = None
    known_limitations: Optional[str] = None
    test_evidence: Optional[str] = None
    status: str = "SUBMITTED"  # SUBMITTED | UNDER_REVIEW | CHANGES_REQUESTED | APPROVED
    submitted_by: str
    submitted_at: str


class DefectItem(BaseModel):
    defect_id: str
    workspace_id: str
    assignment_id: str
    requirement_id: str
    prd_id: str
    title: str
    severity: str = "HIGH"  # CRITICAL | HIGH | MEDIUM | LOW
    priority: str = "P1"    # P1 | P2 | P3
    status: str = "OPEN"    # OPEN | ASSIGNED | IN_PROGRESS | FIX_SUBMITTED | RETEST_PENDING | VERIFIED_CLOSED | REOPENED
    steps_to_reproduce: List[str] = []
    expected_behavior: str
    actual_behavior: str
    test_environment: Optional[str] = "Staging"
    supporting_evidence: Optional[str] = None
    assigned_developer: str
    reporter: str = "QA Lead"
    investigation_notes: Optional[str] = None
    fix_reference: Optional[str] = None
    fix_notes: Optional[str] = None
    created_at: str
    updated_at: str


class DefectFixSubmit(BaseModel):
    fix_notes: str = Field(..., min_length=3, description="Explanation of root cause and fix applied")
    pull_request_url: Optional[str] = None
    commit_reference: Optional[str] = None
    is_ready_for_retest: bool = True


class BlockerCreate(BaseModel):
    assignment_id: str
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    category: str = Field(default="TECHNICAL_DEPENDENCY", description="MISSING_REQUIREMENT | MISSING_DESIGN | TECHNICAL_DEPENDENCY | ENVIRONMENT | API_DEPENDENCY | OTHER")
    impact: str = Field(default="HIGH", description="CRITICAL | HIGH | MEDIUM")
    requested_assistance: Optional[str] = None


class ClarificationCreate(BaseModel):
    assignment_id: str
    requirement_id: Optional[str] = None
    question: str = Field(..., min_length=5)
    reason_for_ambiguity: Optional[str] = None
    expected_decision: Optional[str] = None


class DesignHandoffItem(BaseModel):
    handoff_id: str
    workspace_id: str
    feature_id: Optional[str] = None
    feature_title: str
    prd_id: str
    requirement_id: str
    figma_url: Optional[str] = None
    prototype_url: Optional[str] = None
    design_version: str = "v1.0"
    interaction_specs: List[str] = []
    responsive_states: List[str] = []
    accessibility_notes: List[str] = []
    designer_name: str
    approved_by_pm: bool = True
    handoff_notes: Optional[str] = None
    updated_at: str

