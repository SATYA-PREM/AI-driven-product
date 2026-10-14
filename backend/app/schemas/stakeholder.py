"""
stakeholder.py
--------------
Pydantic schemas for the Business Owner / Stakeholder Workspace:
- Dashboard KPI cards and summary
- Product overview & strategic alignment
- Business objectives and progress
- Roadmap & initiative portfolio
- Pending approvals & decision action requests
- Decision records & audit history
- PRD business reviews & structured feedback
- Milestones & progress tracking
- Business impact & success metrics
- Risks & dependencies register
- Stakeholder notifications
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Dashboard & KPI schemas
# ──────────────────────────────────────────────

class StakeholderKPICard(BaseModel):
    id: str
    label: str
    value: Any
    subtext: str
    target_route: str
    configured: bool = True
    trend: Optional[str] = None
    badge_variant: Optional[str] = "neutral"


class StakeholderDashboardResponse(BaseModel):
    workspace_id: str
    workspace_name: str
    product_name: str
    product_lifecycle_stage: str
    sync_status: str = "Synchronized"
    last_synced_at: str
    kpis: Dict[str, StakeholderKPICard]
    pending_decisions_count: int = 0
    active_initiatives_count: int = 0
    upcoming_milestones_count: int = 0
    open_risks_count: int = 0
    business_impact_summary: str = "Not configured"
    recent_initiatives: List[Dict[str, Any]] = Field(default_factory=list)
    pending_approvals: List[Dict[str, Any]] = Field(default_factory=list)
    critical_risks: List[Dict[str, Any]] = Field(default_factory=list)
    upcoming_milestones: List[Dict[str, Any]] = Field(default_factory=list)
    recent_pm_updates: List[Dict[str, Any]] = Field(default_factory=list)
    key_insights: List[Dict[str, Any]] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Product Overview
# ──────────────────────────────────────────────

class ProductOverviewResponse(BaseModel):
    workspace_id: str
    product_id: str
    product_name: str
    product_description: str
    product_vision: str
    target_customers: str
    business_owner: str
    product_manager: str
    current_lifecycle_stage: str
    strategic_objectives: List[Dict[str, Any]] = Field(default_factory=list)
    customer_problems: List[Dict[str, Any]] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    target_metrics: List[Dict[str, Any]] = Field(default_factory=list)
    current_status: str
    major_initiatives: List[Dict[str, Any]] = Field(default_factory=list)
    key_milestones: List[Dict[str, Any]] = Field(default_factory=list)
    significant_risks: List[Dict[str, Any]] = Field(default_factory=list)
    pending_decisions_count: int = 0
    traceability_links: Dict[str, Any] = Field(default_factory=dict)


# ──────────────────────────────────────────────
# Business Objectives
# ──────────────────────────────────────────────

class BusinessObjectiveItem(BaseModel):
    objective_id: str
    workspace_id: str
    title: str
    description: str
    business_rationale: str
    owner: str
    target_date: str
    status: str  # ON_TRACK | AT_RISK | ACHIEVED | DEFERRED | PLANNED
    customer_problem: str
    how_success_measured: str
    associated_initiatives: List[str] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    evidence_of_progress: str
    outstanding_decisions: int = 0
    last_updated: str


class BusinessObjectiveCreate(BaseModel):
    title: str
    description: str
    business_rationale: str
    owner: Optional[str] = None
    target_date: str
    customer_problem: str
    how_success_measured: str
    associated_initiatives: Optional[List[str]] = None
    success_metrics: Optional[List[str]] = None


# ──────────────────────────────────────────────
# Roadmap & Initiatives Portfolio
# ──────────────────────────────────────────────

class RoadmapInitiativeItem(BaseModel):
    initiative_id: str
    title: str
    business_objective_id: Optional[str] = None
    business_objective_title: Optional[str] = None
    expected_outcome: str
    current_stage: str  # DISCOVERY | PLANNING | DESIGN | IN_DEVELOPMENT | TESTING | RELEASE_READY | LAUNCHED
    priority: str  # CRITICAL | HIGH | MEDIUM | LOW
    target_milestone: str
    planned_timeline: str
    dependencies: List[str] = Field(default_factory=list)
    risk_status: str  # LOW | MEDIUM | HIGH | BLOCKED
    responsible_pm: str
    approval_state: str  # APPROVED | PENDING_APPROVAL | DRAFT | CHANGES_REQUESTED
    committed_delivery: bool = False
    related_prd_id: Optional[str] = None


# ──────────────────────────────────────────────
# Pending Approvals & Decision Records
# ──────────────────────────────────────────────

class ApprovalRequestItem(BaseModel):
    request_id: str
    workspace_id: str
    title: str
    request_type: str  # BUSINESS_CASE | PRODUCT_INITIATIVE | STRATEGIC_PRIORITY | BUDGET_INVESTMENT | PRD_ALIGNMENT | SCOPE_CHANGE | RELEASE_LAUNCH
    related_resource_type: str  # PRD | INITIATIVE | OBJECTIVE | RELEASE
    related_resource_id: str
    related_resource_version: Optional[str] = "v1.0"
    requesting_pm: str
    assigned_approver: str
    assigned_approver_role: str = "STAKEHOLDER"
    submission_date: str
    due_date: Optional[str] = None
    status: str  # PENDING | APPROVED | REJECTED | CHANGES_REQUESTED | CLARIFICATION_REQUESTED
    business_impact_summary: str
    decision_required: str
    supporting_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    proposed_solution: str
    customer_problem: str
    expected_customer_impact: str
    expected_business_value: str
    costs_and_assumptions: Optional[str] = None
    risks_and_dependencies: List[str] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    decision_deadline: Optional[str] = None
    can_current_user_approve: bool = True
    resolved_decision: Optional[Dict[str, Any]] = None


class DecisionSubmitRequest(BaseModel):
    decision: str  # APPROVED | REJECTED | CHANGES_REQUESTED | CLARIFICATION_REQUESTED
    rationale: str
    comments: Optional[str] = None
    follow_up_actions: Optional[List[str]] = None


class DecisionRecordItem(BaseModel):
    decision_id: str
    request_id: str
    workspace_id: str
    decision_type: str
    decision_maker: str
    decision_maker_email: str
    decision: str  # APPROVED | REJECTED | CHANGES_REQUESTED | CLARIFICATION_REQUESTED
    rationale: str
    comments: Optional[str] = None
    timestamp: str
    related_resource_id: str
    related_resource_version: str
    follow_up_actions: List[str] = Field(default_factory=list)
    implementation_status: str  # APPLIED | PENDING_PM_ACTION | SUPERSEDED | REVERSED


# ──────────────────────────────────────────────
# Business Feedback
# ──────────────────────────────────────────────

class StakeholderFeedbackItem(BaseModel):
    feedback_id: str
    workspace_id: str
    related_resource_type: str  # PRD | FEATURE | INITIATIVE | OBJECTIVE
    related_resource_id: str
    related_title: str
    category: str  # STRATEGIC_ALIGNMENT | CUSTOMER_VALUE | BUSINESS_IMPACT | SCOPE | RISK | COMPLIANCE | COST_INVESTMENT | SUCCESS_METRICS | OTHER
    description: str
    business_rationale: str
    expected_impact: str
    supporting_evidence: Optional[str] = None
    suggested_action: str
    created_by: str
    created_by_email: str
    created_at: str
    status: str  # SUBMITTED | UNDER_REVIEW | RESPONSE_PROVIDED | ACCEPTED | DECLINED | RESOLVED
    pm_response: Optional[str] = None
    pm_response_by: Optional[str] = None
    pm_response_at: Optional[str] = None


class StakeholderFeedbackCreate(BaseModel):
    related_resource_type: str = "PRD"
    related_resource_id: str
    related_title: Optional[str] = None
    category: str
    description: str
    business_rationale: str
    expected_impact: str
    supporting_evidence: Optional[str] = None
    suggested_action: str


class PMFeedbackResponseSubmit(BaseModel):
    response: str
    status: str = "RESPONSE_PROVIDED"  # RESPONSE_PROVIDED | ACCEPTED | DECLINED | RESOLVED


# ──────────────────────────────────────────────
# Milestones & Progress
# ──────────────────────────────────────────────

class MilestoneItem(BaseModel):
    milestone_id: str
    workspace_id: str
    title: str
    associated_initiative: str
    associated_initiative_id: Optional[str] = None
    expected_outcome: str
    target_date: str
    status: str  # PLANNED | IN_PROGRESS | AT_RISK | BLOCKED | COMPLETED | CANCELLED
    responsible_pm: str
    key_dependencies: List[str] = Field(default_factory=list)
    significant_blockers: List[str] = Field(default_factory=list)
    progress_percentage: Optional[int] = None
    progress_explanation: Optional[str] = None
    decisions_required: List[str] = Field(default_factory=list)
    last_updated: str


# ──────────────────────────────────────────────
# Business Impact & Success Metrics
# ──────────────────────────────────────────────

class BusinessMetricItem(BaseModel):
    metric_id: str
    workspace_id: str
    name: str
    description: str
    business_objective: str
    measurement_definition: str
    baseline: Optional[str] = None
    target: str
    current_value: Optional[str] = None
    measurement_period: str
    data_source: str
    status: str  # ON_TRACK | AT_RISK | BEHIND | ACHIEVED | NOT_CONFIGURED
    is_configured: bool = True
    metric_type: str = "MEASURED_RESULT"  # MEASURED_RESULT | FORECAST | TARGET | ESTIMATE | AI_HYPOTHESIS
    trend: Optional[str] = None
    data_freshness: str = "Updated today"
    responsible_owner: str
    last_updated: str
    historical_observations: List[Dict[str, Any]] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Risks & Dependencies Register
# ──────────────────────────────────────────────

class BusinessRiskItem(BaseModel):
    risk_id: str
    workspace_id: str
    title: str
    description: str
    category: str  # STRATEGIC | CUSTOMER_IMPACT | DELIVERY | TECHNICAL_DEPENDENCY | FINANCIAL | OPERATIONAL | COMPLIANCE | EXTERNAL_DEPENDENCY
    related_initiative: str
    business_impact: str
    likelihood: str  # HIGH | MEDIUM | LOW
    severity: str    # CRITICAL | HIGH | MEDIUM | LOW
    mitigation_plan: str
    owner: str
    target_resolution_date: str
    status: str  # OPEN | MITIGATING | RESOLVED | ACCEPTED | ESCALATED
    last_updated: str
    comments: List[Dict[str, Any]] = Field(default_factory=list)


class BusinessDependencyItem(BaseModel):
    dependency_id: str
    workspace_id: str
    description: str
    dependent_initiative: str
    responsible_owner: str
    expected_resolution_date: str
    status: str  # RESOLVED | IN_PROGRESS | AT_RISK | BLOCKED
    business_impact_if_delayed: str


# ──────────────────────────────────────────────
# Stakeholder Notifications
# ──────────────────────────────────────────────

class StakeholderNotificationItem(BaseModel):
    notification_id: str
    workspace_id: str
    event_type: str  # NEW_APPROVAL_REQUEST | APPROVAL_DEADLINE | PM_RESPONSE | MATERIAL_PRD_CHANGE | MILESTONE_AT_RISK | SIGNIFICANT_RISK | DECISION_RECORDED | METRIC_UPDATED
    message: str
    related_record_type: str
    related_record_id: str
    timestamp: str
    is_read: bool = False
    action_url: str

