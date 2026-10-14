"""
qa.py
-----
Pydantic schemas for the QA Lead (Tester) Workspace:
- Test Plans & Test Suites
- Test Cases & Step definitions
- Test Execution records & step outcomes
- Defect tracking, verification & reopening
- QA Reports & release readiness metrics
- QA Dashboard overview responses
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime


# ──────────────────────────────────────────────
# Test Step & Execution Step Schemas
# ──────────────────────────────────────────────

class TestStep(BaseModel):
    step_number: int = Field(..., ge=1, description="Sequential step index")
    action: str = Field(..., description="Action to perform")
    expected_result: str = Field(..., description="Expected outcome of step")


class StepExecutionResult(BaseModel):
    step_number: int = Field(..., ge=1)
    action: Optional[str] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    status: str = Field("PASSED", description="PASSED | FAILED | BLOCKED | SKIPPED | NOT_EXECUTED")
    evidence_url: Optional[str] = None


# ──────────────────────────────────────────────
# Test Case Schemas
# ──────────────────────────────────────────────

class TestCaseCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Descriptive test case title")
    description: Optional[str] = Field(None, description="Detailed test case purpose")
    prd_id: Optional[str] = Field(None, description="Linked PRD identifier")
    prd_version: Optional[str] = Field("v1.0", description="Authoritative PRD version")
    requirement_id: Optional[str] = Field(None, description="Authoritative Requirement ID")
    criterion_id: Optional[str] = Field(None, description="Acceptance Criterion ID")
    preconditions: Optional[str] = Field(None, description="Prerequisite environment or data state")
    steps: List[TestStep] = Field(default_factory=list, description="Ordered test steps")
    expected_results: str = Field(..., min_length=3, description="Authoritative expected result")
    test_data_requirements: Optional[str] = Field(None, description="Test data accounts or tokens needed")
    test_type: str = Field("FUNCTIONAL", description="FUNCTIONAL | INTEGRATION | REGRESSION | USABILITY | ACCESSIBILITY | PERFORMANCE | SECURITY | COMPATIBILITY | API_VALIDATION")
    priority: str = Field("P2", description="P1 | P2 | P3 | P4")
    environment: Optional[str] = Field("Staging", description="Target test environment")
    owner: Optional[str] = Field("QA Lead", description="Assigned tester")
    suite_id: Optional[str] = Field(None, description="Associated Test Suite ID")
    plan_id: Optional[str] = Field(None, description="Associated Test Plan ID")


class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = None
    requirement_id: Optional[str] = None
    criterion_id: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[List[TestStep]] = None
    expected_results: Optional[str] = None
    test_data_requirements: Optional[str] = None
    test_type: Optional[str] = None
    priority: Optional[str] = None
    environment: Optional[str] = None
    owner: Optional[str] = None
    suite_id: Optional[str] = None
    plan_id: Optional[str] = None
    status: Optional[str] = None


class TestCaseResponse(BaseModel):
    test_case_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = "v1.0"
    requirement_id: Optional[str] = None
    criterion_id: Optional[str] = None
    preconditions: Optional[str] = None
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    expected_results: str
    test_data_requirements: Optional[str] = None
    test_type: str = "FUNCTIONAL"
    priority: str = "P2"
    environment: str = "Staging"
    owner: str = "QA Lead"
    status: str = "ACTIVE"  # DRAFT | ACTIVE | DEPRECATED
    latest_outcome: str = "NOT_EXECUTED"  # PASSED | FAILED | BLOCKED | NOT_EXECUTED | SKIPPED
    execution_count: int = 0
    suite_id: Optional[str] = None
    plan_id: Optional[str] = None
    created_at: str
    updated_at: str


# ──────────────────────────────────────────────
# Test Execution Schemas
# ──────────────────────────────────────────────

class TestExecutionCreate(BaseModel):
    test_case_id: str = Field(..., description="Target test case identifier")
    outcome: str = Field(..., description="PASSED | FAILED | BLOCKED | NOT_EXECUTED | SKIPPED")
    actual_results: str = Field(..., min_length=2, description="Observed result in execution")
    environment: Optional[str] = Field("Staging", description="Execution environment")
    step_results: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    evidence_notes: Optional[str] = Field(None, description="Execution logs, telemetry, or details")
    evidence_attachments: Optional[List[str]] = Field(default_factory=list, description="Attachment links/images")
    duration_seconds: Optional[int] = Field(None, ge=0)


class TestExecutionResponse(BaseModel):
    execution_id: str
    test_case_id: str
    test_case_title: Optional[str] = None
    workspace_id: str
    feature_id: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = None
    environment: str
    attempt_number: int
    executed_by: str
    tester_email: Optional[str] = None
    outcome: str
    actual_results: str
    step_results: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_notes: Optional[str] = None
    evidence_attachments: List[str] = Field(default_factory=list)
    defect_ids: List[str] = Field(default_factory=list)
    executed_at: str
    duration_seconds: Optional[int] = None


# ──────────────────────────────────────────────
# Test Plan & Test Suite Schemas
# ──────────────────────────────────────────────

class TestPlanCreate(BaseModel):
    name: str = Field(..., min_length=3, description="Test plan name")
    description: Optional[str] = Field(None, description="Objectives and scope")
    feature_scope: Optional[str] = Field(None, description="Feature or release scope")
    prd_version: Optional[str] = Field("v1.0", description="Target PRD version")
    test_objectives: Optional[str] = Field(None, description="High-level test goals")
    test_environment: Optional[str] = Field("Staging / Production Canary", description="Target environment")
    test_types: List[str] = Field(default_factory=lambda: ["FUNCTIONAL", "REGRESSION"])
    entry_criteria: Optional[str] = Field("Developer PR merged; Staging build deployed successfully.")
    exit_criteria: Optional[str] = Field("100% P1/P2 test cases passed; zero open Critical/High defects.")
    test_owner: Optional[str] = Field("QA Lead")
    planned_start_date: Optional[str] = None
    planned_completion_date: Optional[str] = None
    status: str = Field("READY", description="DRAFT | READY | IN_PROGRESS | BLOCKED | COMPLETED | ARCHIVED")


class TestPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    feature_scope: Optional[str] = None
    prd_version: Optional[str] = None
    test_objectives: Optional[str] = None
    test_environment: Optional[str] = None
    test_types: Optional[List[str]] = None
    entry_criteria: Optional[str] = None
    exit_criteria: Optional[str] = None
    test_owner: Optional[str] = None
    planned_start_date: Optional[str] = None
    planned_completion_date: Optional[str] = None
    status: Optional[str] = None


class TestPlanResponse(BaseModel):
    plan_id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    feature_scope: Optional[str] = None
    prd_version: Optional[str] = None
    test_objectives: Optional[str] = None
    test_environment: Optional[str] = None
    test_types: List[str] = Field(default_factory=list)
    entry_criteria: Optional[str] = None
    exit_criteria: Optional[str] = None
    test_owner: str
    planned_start_date: Optional[str] = None
    planned_completion_date: Optional[str] = None
    status: str
    test_case_count: int = 0
    passed_count: int = 0
    failed_count: int = 0
    pass_rate: float = 0.0
    created_at: str
    updated_at: str


class TestSuiteCreate(BaseModel):
    suite_name: str = Field(..., min_length=3)
    description: Optional[str] = None
    plan_id: Optional[str] = None
    related_feature: Optional[str] = None
    test_case_ids: List[str] = Field(default_factory=list)
    owner: Optional[str] = Field("QA Lead")


class TestSuiteUpdate(BaseModel):
    suite_name: Optional[str] = None
    description: Optional[str] = None
    plan_id: Optional[str] = None
    related_feature: Optional[str] = None
    test_case_ids: Optional[List[str]] = None
    owner: Optional[str] = None


class TestSuiteResponse(BaseModel):
    suite_id: str
    suite_name: str
    description: Optional[str] = None
    workspace_id: str
    plan_id: Optional[str] = None
    related_feature: Optional[str] = None
    test_case_ids: List[str] = Field(default_factory=list)
    test_case_count: int = 0
    pass_count: int = 0
    fail_count: int = 0
    blocked_count: int = 0
    execution_status: str = "PENDING"
    last_execution: Optional[str] = None
    owner: str = "QA Lead"
    created_at: str
    updated_at: str


# ──────────────────────────────────────────────
# Defect Schemas
# ──────────────────────────────────────────────

class DefectCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Concise defect summary")
    description: Optional[str] = Field(None, description="Detailed defect explanation")
    feature_id: Optional[str] = None
    feature_title: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = None
    requirement_id: Optional[str] = None
    criterion_id: Optional[str] = None
    test_case_id: Optional[str] = None
    execution_id: Optional[str] = None
    severity: str = Field("HIGH", description="CRITICAL | HIGH | MEDIUM | LOW")
    priority: str = Field("P2", description="P1 | P2 | P3 | P4")
    environment: Optional[str] = Field("Staging", description="Observed environment")
    build_reference: Optional[str] = Field(None, description="Commit hash or build number")
    preconditions: Optional[str] = None
    steps_to_reproduce: Union[List[str], str] = Field(..., description="Steps to replicate bug")
    expected_result: str = Field(..., min_length=2)
    actual_result: str = Field(..., min_length=2)
    reproducibility: Optional[str] = Field("ALWAYS", description="ALWAYS | INTERMITTENT | ONCE")
    supporting_evidence: Optional[str] = None
    assigned_developer: Optional[str] = Field(None, description="Target developer for fix")


class DefectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    assigned_developer: Optional[str] = None
    status: Optional[str] = None
    steps_to_reproduce: Optional[Union[List[str], str]] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    supporting_evidence: Optional[str] = None


class DefectVerification(BaseModel):
    retest_execution_id: Optional[str] = Field(None, description="ID of verifying execution run")
    passed: bool = Field(True, description="True if retest passed, False if still failing")
    verification_notes: str = Field(..., min_length=3, description="QA verification evidence & details")


class DefectReopen(BaseModel):
    retest_execution_id: Optional[str] = None
    reopen_reason: str = Field(..., min_length=3, description="Detailed explanation of failure persistence")
    new_evidence: Optional[str] = None


class DefectResponse(BaseModel):
    defect_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    feature_id: Optional[str] = None
    feature_title: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = None
    requirement_id: Optional[str] = None
    criterion_id: Optional[str] = None
    test_case_id: Optional[str] = None
    execution_id: Optional[str] = None
    severity: str
    priority: str
    environment: str
    build_reference: Optional[str] = None
    preconditions: Optional[str] = None
    steps_to_reproduce: Union[List[str], str]
    expected_result: str
    actual_result: str
    reproducibility: str = "ALWAYS"
    supporting_evidence: Optional[str] = None
    reporter: str
    assigned_developer: Optional[str] = None
    status: str
    reopen_count: int = 0
    fix_reference: Optional[str] = None
    fix_notes: Optional[str] = None
    verification_notes: Optional[str] = None
    created_at: str
    updated_at: str


# ──────────────────────────────────────────────
# QA Report & Release Readiness Schemas
# ──────────────────────────────────────────────

class QAReportCreate(BaseModel):
    title: str = Field(..., min_length=3, description="QA report title")
    feature_id: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = "v1.0"
    test_plan_id: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    known_limitations: Optional[str] = None
    outstanding_risks: Optional[str] = None
    qa_recommendation: str = Field("QA_PASSED", description="NOT_ASSESSED | TESTING_IN_PROGRESS | READY_FOR_REVIEW | QA_PASSED | QA_FAILED | BLOCKED")


class QAReportResponse(BaseModel):
    report_id: str
    workspace_id: str
    title: str
    feature_id: Optional[str] = None
    prd_id: Optional[str] = None
    prd_version: Optional[str] = None
    test_plan_id: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    retesting_status: Dict[str, Any] = Field(default_factory=dict)
    requirement_coverage_pct: float = 0.0
    known_limitations: Optional[str] = None
    outstanding_risks: Optional[str] = None
    qa_recommendation: str
    author: str
    created_at: str


class ReleaseReadinessResponse(BaseModel):
    workspace_id: str
    feature_scope: str
    prd_version: str
    total_tests: int
    execution_coverage_pct: float
    latest_passed: int
    latest_failed: int
    open_critical_defects: int
    open_high_defects: int
    blocked_tests: int
    unexecuted_required_tests: int
    outstanding_approvals: List[str] = Field(default_factory=list)
    known_risks: List[str] = Field(default_factory=list)
    qa_recommendation: str
    ready_for_release: bool
    missing_criteria: List[str] = Field(default_factory=list)


# ──────────────────────────────────────────────
# QA Dashboard Response Schema
# ──────────────────────────────────────────────

class QADashboardResponse(BaseModel):
    workspace_id: str
    kpis: Dict[str, Any]
    test_queue: List[Dict[str, Any]] = Field(default_factory=list)
    priority_defects: List[Dict[str, Any]] = Field(default_factory=list)
    recent_executions: List[Dict[str, Any]] = Field(default_factory=list)
    features_awaiting_qa: List[Dict[str, Any]] = Field(default_factory=list)
    retesting_queue: List[Dict[str, Any]] = Field(default_factory=list)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)
    release_readiness_summary: Dict[str, Any] = Field(default_factory=dict)

