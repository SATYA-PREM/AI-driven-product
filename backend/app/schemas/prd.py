"""
prd.py
------
Pydantic API request and response schemas for PRD Generation and Management.
Includes schemas for the 4-Agent CrewAI pipeline:
- Agent 1: ProblemDefinition (with multi-item itemized_problems)
- Agent 2: RequirementsAnalysis (with distinct acceptance_criteria)
- Agent 3: ProductPlan (scope, features, metrics, risks)
- Agent 4: Traceability, ConflictValidation, and AIGenerationRunAudit
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional, Union
from pydantic import BaseModel, Field


# --- Agent Intermediate Output Schemas ---
class ItemizedProblem(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    root_cause: Optional[str] = None
    impact: Optional[str] = "high"
    evidence_count: Optional[int] = 1
    customer_need: Optional[str] = None


class ProblemDefinition(BaseModel):
    primary_problem: str
    itemized_problems: List[ItemizedProblem] = Field(default_factory=list)
    secondary_problems: List[str] = Field(default_factory=list)
    root_causes: List[str] = Field(default_factory=list)
    customer_need: str
    affected_users: List[str] = Field(default_factory=list)
    business_context: str
    evidence_summary: Dict[str, Any] = Field(default_factory=dict)
    confidence: str = "high"


class RequirementTraceabilityItem(BaseModel):
    requirement_id: str
    source_issues: List[str] = Field(default_factory=list)
    source_opportunities: List[str] = Field(default_factory=list)
    source_evidence: List[str] = Field(default_factory=list)


class RequirementsAnalysis(BaseModel):
    functional_requirements: List[Dict[str, Any]] = Field(default_factory=list)
    non_functional_requirements: List[Dict[str, Any]] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    requirement_traceability: List[RequirementTraceabilityItem] = Field(default_factory=list)


class ProductPlanScope(BaseModel):
    in_scope: List[str] = Field(default_factory=list)
    out_of_scope: List[str] = Field(default_factory=list)


class ProductPlan(BaseModel):
    product_objective: str
    target_users: List[Dict[str, Any]] = Field(default_factory=list)
    proposed_solution: str
    scope: ProductPlanScope = Field(default_factory=ProductPlanScope)
    features: List[Dict[str, Any]] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    priorities: List[Dict[str, Any]] = Field(default_factory=list)
    risks: List[Dict[str, Any]] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)


class ConflictValidation(BaseModel):
    complete: bool = True
    warnings: List[str] = Field(default_factory=list)
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)


class TraceabilityMatrixItem(BaseModel):
    problem: Optional[str] = None
    issue_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    evidence_id: Optional[str] = None
    requirement_id: Optional[str] = None
    feature_id: Optional[str] = None
    story_id: Optional[str] = None
    acceptance_criteria: Optional[str] = None


class AIGenerationRunAudit(BaseModel):
    run_id: str
    workspace_id: str
    total_duration_seconds: float
    stages: Dict[str, Any] = Field(default_factory=dict)
    validation: ConflictValidation = Field(default_factory=ConflictValidation)
    traceability: List[TraceabilityMatrixItem] = Field(default_factory=list)
    generated_at: str
    status: str = "SUCCESS"


# --- API Request Schemas ---
class PRDGenerateRequest(BaseModel):
    source_review_id: Optional[str] = "REV-BATCH"
    product_id: Optional[str] = "default-product"
    dataset_id: Optional[str] = None
    source_type: Optional[str] = None
    pm_comments: Optional[str] = None
    custom_instructions: Optional[str] = None
    selected_insight_ids: Optional[List[str]] = None
    selected_opportunity_ids: Optional[List[str]] = None


class PRDUpdateRequest(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[Union[str, Dict[str, Any]]] = None
    background: Optional[str] = None
    customer_need: Optional[str] = None
    business_objective: Optional[str] = None
    target_users: Optional[List[str]] = None
    proposed_solution: Optional[str] = None
    scope: Optional[Dict[str, List[str]]] = None
    requirements: Optional[List[Dict[str, Any]]] = None
    features: Optional[List[Dict[str, Any]]] = None
    success_metrics: Optional[List[str]] = None
    constraints: Optional[List[str]] = None
    assumptions: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    risks: Optional[List[str]] = None


class PRDReviewRequest(BaseModel):
    decision: str = Field(..., description="'approved' or 'changes_requested'")
    comments: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    reviewed_by: Optional[str] = "PM Reviewer"


class StoryGenerationRequest(BaseModel):
    requirement_ids: Optional[List[str]] = None


class FeatureExportRequest(BaseModel):
    feature_ids: List[str] = Field(default_factory=list, description="Selected feature IDs to include in the circulation pack")
    circulation_notes: Optional[str] = Field(default="", description="PM notes and instructions for team circulation")
    reviewer_name: Optional[str] = "Priya Sharma (PM)"


# --- API Response Schemas ---
class PRDContextPreviewResponse(BaseModel):
    workspace_id: str
    source_review_id: str
    dataset_id: Optional[str] = None
    source_type: Optional[str] = None
    dataset_name: Optional[str] = "Active Feedback Collection"
    review_status: str
    reviewed_by: str
    pm_comments: str
    total_insights_count: int = 0
    approved_issues_count: int = 0
    pending_issues_count: int = 0
    rejected_issues_count: int = 0
    approved_opportunities_count: int = 0
    total_evidence_count: int = 0
    pm_review: Optional[Dict[str, Any]] = None
    approved_issues: List[Dict[str, Any]] = Field(default_factory=list)
    pending_issues: List[Dict[str, Any]] = Field(default_factory=list)
    approved_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    pending_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_records: List[Dict[str, Any]] = Field(default_factory=list)
    product_context: Dict[str, Any] = Field(default_factory=dict)
    business_context: Dict[str, Any] = Field(default_factory=dict)
    priority_context: Dict[str, Any] = Field(default_factory=dict)
    suggested_next_steps: Optional[Dict[str, Any]] = None
    ready_for_generation: bool = True


class PRDFullResponse(BaseModel):
    project: Dict[str, Any]
    context: Dict[str, Any]
    document: Dict[str, Any]
    requirements: List[Dict[str, Any]]
    user_stories: List[Dict[str, Any]]
    acceptance_criteria: List[Dict[str, Any]]
    features: List[Dict[str, Any]]
    phases: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    reviews: List[Dict[str, Any]]
    versions: List[Dict[str, Any]]
    ai_generation_run: Optional[Dict[str, Any]] = None
    traceability: Optional[List[Dict[str, Any]]] = None
    validation: Optional[Dict[str, Any]] = None


class ProvenanceTraceResponse(BaseModel):
    item_type: str
    item_id: str
    provenance_chain: List[Dict[str, Any]]
