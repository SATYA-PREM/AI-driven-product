"""
prd.py
------
Pydantic domain models for Milestone 3 PRD Generation, Lifecycle,
Structured Sections, Requirements, User Stories, Acceptance Criteria,
Features, Phasing, Tasks, and Full Traceability.
"""

from __future__ import annotations

from typing import Any, List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# --- 1. PRD Project Root ---
class PRDProjectModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    prd_id: str
    workspace_id: str
    product_id: Optional[str] = "default-product"
    source_review_id: str = "REV-001"
    title: str
    status: str = "draft"  # draft, pm_review, changes_requested, approved, archived
    created_by: str = "user_pm"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    current_version: str = "v1.0"
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None


# --- 2. PRD Generation Context Snapshot ---
class PRDGenerationContextModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    context_id: str
    prd_id: str
    workspace_id: str
    source_review_id: str = "REV-001"
    generation_version: int = 1
    pm_review: Dict[str, Any] = Field(default_factory=dict)
    approved_issues: List[Dict[str, Any]] = Field(default_factory=list)
    approved_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_records: List[str] = Field(default_factory=list)
    product_context: Dict[str, Any] = Field(default_factory=dict)
    business_context: Dict[str, Any] = Field(default_factory=dict)
    priority_context: Dict[str, Any] = Field(default_factory=dict)
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# --- 3. PRD Document Content ---
class PRDScope(BaseModel):
    in_scope: List[str] = Field(default_factory=list)
    out_of_scope: List[str] = Field(default_factory=list)


class PRDDocumentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    prd_id: str
    version: str = "v1.0"
    title: str
    problem_statement: str
    background: str
    customer_need: str
    business_objective: str
    target_users: List[str] = Field(default_factory=list)
    proposed_solution: str
    scope: PRDScope = Field(default_factory=PRDScope)
    requirements: List[Dict[str, Any]] = Field(default_factory=list)
    features: List[Dict[str, Any]] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    generated_by: str = "crewai-gemini"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# --- 4. Requirement ---
class PRDRequirementModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    requirement_id: str
    prd_id: str
    version: str = "v1.0"
    title: str
    description: str
    type: str = "functional"  # functional, non-functional, security, performance
    priority: str = "high"  # high, medium, low
    source_insights: List[str] = Field(default_factory=list)
    source_evidence: List[str] = Field(default_factory=list)
    acceptance_criteria: List[str] = Field(default_factory=list)
    status: str = "approved"  # proposed, approved, rejected


# --- 5. User Story ---
class UserStoryModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    story_id: str
    prd_id: str
    requirement_id: str
    title: str
    story: str  # As a <persona>, I want <feature> so that <benefit>
    persona: str = "enterprise_user"
    priority: str = "high"
    status: str = "planned"
    acceptance_criteria: List[str] = Field(default_factory=list)


# --- 6. Acceptance Criteria ---
class AcceptanceCriterionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    criteria_id: str
    story_id: str
    requirement_id: str
    description: str
    type: str = "functional"
    status: str = "approved"


# --- 7. Feature & Prioritization ---
class PRDFeatureModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    feature_id: str
    prd_id: str
    name: str
    description: str
    requirement_ids: List[str] = Field(default_factory=list)
    story_ids: List[str] = Field(default_factory=list)
    priority: str = "high"
    status: str = "planned"
    phase_id: Optional[str] = "PHASE-001"


class FeaturePrioritizationModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    feature_id: str
    framework: str = "weighted_scoring"
    criteria: Dict[str, float] = Field(default_factory=dict)
    weights: Dict[str, float] = Field(default_factory=dict)
    score: float = 8.5
    priority: str = "high"
    scored_by: str = "system"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# --- 8. Product Phase & Tasks ---
class ProductPhaseModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    phase_id: str
    prd_id: str
    name: str
    description: str
    objective: str
    feature_ids: List[str] = Field(default_factory=list)
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    status: str = "planned"
    approval_status: str = "approved"


class DevelopmentTaskModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    task_id: str
    phase_id: str
    feature_id: str
    story_id: str
    title: str
    description: str
    assigned_to: str = "unassigned"
    priority: str = "high"
    status: str = "todo"
    estimated_effort: int = 5
    dependency_ids: List[str] = Field(default_factory=list)
    acceptance_criteria: List[str] = Field(default_factory=list)


# --- 9. Reviews & Versions ---
class PRDReviewModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    review_id: str
    prd_id: str
    version: str = "v1.0"
    reviewed_by: str
    review_type: str = "pm_gate"
    decision: str = "approved"  # approved, changes_requested
    comments: List[Dict[str, str]] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class PRDVersionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    version_id: str
    prd_id: str
    version: str
    parent_version: Optional[str] = "v1.0"
    change_type: str = "pm_update"
    change_summary: List[str] = Field(default_factory=list)
    changed_by: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
