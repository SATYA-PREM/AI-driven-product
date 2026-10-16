"""
qa.py
-----
FastAPI routes for QA Lead / Tester Workspace:
- QA Dashboard & KPIs
- My Test Assignments & Requirement Acceptance Criteria
- Test Plans & Test Suites
- Test Cases & Step Management
- Test Execution tracking with immutable attempt history
- Defect & Bug tracking, Developer fix review & Retesting queue
- Regression Testing suites
- QA Reports & Release Readiness gating
- PM Clarification requests
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status

from app.schemas.qa import (
    QADashboardResponse,
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    TestExecutionCreate,
    TestExecutionResponse,
    TestPlanCreate,
    TestPlanUpdate,
    TestPlanResponse,
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    DefectCreate,
    DefectUpdate,
    DefectVerification,
    DefectReopen,
    DefectResponse,
    QAReportCreate,
    QAReportResponse,
    ReleaseReadinessResponse,
)
from app.middleware.auth_middleware import get_current_user
from app.services.qa_service import qa_service
from app.services.auth.permission_service import permission_service
from app.core.constants import Permission

router = APIRouter(
    prefix="/workspaces/{workspace_id}/qa",
    tags=["16. QA Lead Workspace"],
    dependencies=[Depends(get_current_user)],
)


# ──────────────────────────────────────────────
# 1. QA Dashboard
# ──────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=QADashboardResponse,
    summary="Get QA Lead Dashboard overview, KPIs, and testing queues",
)
def get_qa_dashboard(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return qa_service.get_dashboard(workspace_id=workspace_id, user_id=user_id, email=email)


# ──────────────────────────────────────────────
# 2. My Test Assignments
# ──────────────────────────────────────────────

@router.get(
    "/assignments",
    response_model=List[Dict[str, Any]],
    summary="List all QA testing assignments for current workspace",
)
def list_qa_assignments(
    workspace_id: str = Path(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_id = current_user.get("user_id") or current_user.get("id") or ""
    email = current_user.get("email") or ""
    return qa_service.get_assignments(workspace_id=workspace_id, user_id=user_id, email=email, status=status)


@router.get(
    "/assignments/{assignment_id}",
    response_model=Dict[str, Any],
    summary="Get single QA assignment with requirements, criteria, and test cases",
)
def get_assignment_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)


@router.patch(
    "/assignments/{assignment_id}/status",
    response_model=Dict[str, Any],
    summary="Update QA assignment testing status",
)
def update_assignment_status(
    workspace_id: str = Path(..., description="Workspace ID"),
    assignment_id: str = Path(..., description="Assignment ID"),
    status: str = Query(..., description="New status"),
    notes: Optional[str] = Query(None, description="Progress notes"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.update_assignment_status(
        workspace_id=workspace_id,
        assignment_id=assignment_id,
        new_status=status,
        user_name=user_name,
        notes=notes,
    )


# ──────────────────────────────────────────────
# 3. Assigned PRDs & Acceptance Criteria (Read-only)
# ──────────────────────────────────────────────

@router.get(
    "/requirements",
    response_model=Dict[str, Any],
    summary="Inspect approved PRD requirements and acceptance criteria (Read-only)",
)
def get_requirements(
    workspace_id: str = Path(..., description="Workspace ID"),
    prd_id: Optional[str] = Query(None, description="Target PRD ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_requirements(workspace_id=workspace_id, prd_id=prd_id)


# ──────────────────────────────────────────────
# 4. Test Plans & Test Suites
# ──────────────────────────────────────────────

@router.get(
    "/test-plans",
    response_model=List[TestPlanResponse],
    summary="List all test plans for workspace",
)
def list_test_plans(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_test_plans(workspace_id=workspace_id)


@router.post(
    "/test-plans",
    response_model=TestPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new test plan",
)
def create_test_plan(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: TestPlanCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_test_plan(workspace_id=workspace_id, payload=body.model_dump(), user_name=user_name)


@router.patch(
    "/test-plans/{plan_id}",
    response_model=TestPlanResponse,
    summary="Update test plan details or status",
)
def update_test_plan(
    workspace_id: str = Path(..., description="Workspace ID"),
    plan_id: str = Path(..., description="Test Plan ID"),
    body: TestPlanUpdate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.update_test_plan(workspace_id=workspace_id, plan_id=plan_id, payload=body.model_dump(), user_name=user_name)


@router.get(
    "/test-suites",
    response_model=List[TestSuiteResponse],
    summary="List test suites",
)
def list_test_suites(
    workspace_id: str = Path(..., description="Workspace ID"),
    plan_id: Optional[str] = Query(None, description="Filter by test plan"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_test_suites(workspace_id=workspace_id, plan_id=plan_id)


@router.post(
    "/test-suites",
    response_model=TestSuiteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new test suite",
)
def create_test_suite(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: TestSuiteCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_test_suite(workspace_id=workspace_id, payload=body.model_dump(), user_name=user_name)


# ──────────────────────────────────────────────
# 5. Test Cases
# ──────────────────────────────────────────────

@router.get(
    "/test-cases",
    response_model=List[TestCaseResponse],
    summary="List test cases with filters",
)
def list_test_cases(
    workspace_id: str = Path(..., description="Workspace ID"),
    suite_id: Optional[str] = Query(None, description="Filter by test suite"),
    requirement_id: Optional[str] = Query(None, description="Filter by requirement"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    test_type: Optional[str] = Query(None, description="Filter by test type"),
    outcome: Optional[str] = Query(None, description="Filter by outcome"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_test_cases(
        workspace_id=workspace_id,
        suite_id=suite_id,
        requirement_id=requirement_id,
        priority=priority,
        test_type=test_type,
        outcome=outcome,
    )


@router.post(
    "/test-cases",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new test case linked to requirements",
)
def create_test_case(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: TestCaseCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_test_case(workspace_id=workspace_id, payload=body.model_dump(), user_name=user_name)


@router.get(
    "/test-cases/{case_id}",
    response_model=Dict[str, Any],
    summary="Get single test case with execution history and linked defects",
)
def get_test_case_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    case_id: str = Path(..., description="Test Case ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_test_case_detail(workspace_id=workspace_id, test_case_id=case_id)


@router.put(
    "/test-cases/{case_id}",
    response_model=Dict[str, Any],
    summary="Update test case while preserving historical execution data",
)
def update_test_case(
    workspace_id: str = Path(..., description="Workspace ID"),
    case_id: str = Path(..., description="Test Case ID"),
    body: TestCaseUpdate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.update_test_case(workspace_id=workspace_id, test_case_id=case_id, payload=body.model_dump(), user_name=user_name)


# ──────────────────────────────────────────────
# 6. Test Execution
# ──────────────────────────────────────────────

@router.post(
    "/test-cases/{case_id}/execute",
    response_model=TestExecutionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a manual test execution outcome and evidence",
)
def execute_test_case(
    workspace_id: str = Path(..., description="Workspace ID"),
    case_id: str = Path(..., description="Test Case ID"),
    body: TestExecutionCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    user_email = current_user.get("email") or ""
    return qa_service.execute_test_case(
        workspace_id=workspace_id,
        test_case_id=case_id,
        payload=body.model_dump(),
        user_name=user_name,
        user_email=user_email,
    )


@router.get(
    "/executions",
    response_model=List[TestExecutionResponse],
    summary="List all recorded test executions",
)
def list_executions(
    workspace_id: str = Path(..., description="Workspace ID"),
    case_id: Optional[str] = Query(None, description="Filter by test case"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_executions(workspace_id=workspace_id, test_case_id=case_id)


# ──────────────────────────────────────────────
# 7. Defects & Retesting Workflow
# ──────────────────────────────────────────────

@router.get(
    "/defects",
    response_model=List[DefectResponse],
    summary="List all defects for workspace",
)
def list_defects(
    workspace_id: str = Path(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    assignment_id: Optional[str] = Query(None, description="Filter by assignment"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_defects(
        workspace_id=workspace_id,
        status=status,
        severity=severity,
        assignment_id=assignment_id,
    )


@router.post(
    "/defects",
    response_model=DefectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a new defect linked to a failed test or execution",
)
def create_defect(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: DefectCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_defect(workspace_id=workspace_id, payload=body.model_dump(), user_name=user_name)


@router.patch(
    "/defects/{defect_id}",
    response_model=DefectResponse,
    summary="Update defect properties (severity, priority, developer assignment)",
)
def update_defect(
    workspace_id: str = Path(..., description="Workspace ID"),
    defect_id: str = Path(..., description="Defect ID"),
    body: DefectUpdate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.update_defect(workspace_id=workspace_id, defect_id=defect_id, payload=body.model_dump(), user_name=user_name)


@router.post(
    "/defects/{defect_id}/verify",
    response_model=DefectResponse,
    summary="Verify developer fix after retest (Pass marks VERIFIED, Fail marks REOPENED)",
)
def verify_defect(
    workspace_id: str = Path(..., description="Workspace ID"),
    defect_id: str = Path(..., description="Defect ID"),
    body: DefectVerification = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.verify_defect(workspace_id=workspace_id, defect_id=defect_id, payload=body.model_dump(), user_name=user_name)


@router.post(
    "/defects/{defect_id}/reopen",
    response_model=DefectResponse,
    summary="Reopen defect when retest fails or regression occurs",
)
def reopen_defect(
    workspace_id: str = Path(..., description="Workspace ID"),
    defect_id: str = Path(..., description="Defect ID"),
    body: DefectReopen = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.reopen_defect(workspace_id=workspace_id, defect_id=defect_id, payload=body.model_dump(), user_name=user_name)


@router.get(
    "/retesting-queue",
    response_model=List[Dict[str, Any]],
    summary="Get defects awaiting verification in retesting queue",
)
def get_retesting_queue(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_retesting_queue(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 8. Regression Testing
# ──────────────────────────────────────────────

@router.get(
    "/regression-tests",
    response_model=Dict[str, Any],
    summary="Get regression test suite scope and execution metrics",
)
def get_regression_tests(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_regression_tests(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 9. QA Reports & Release Readiness
# ──────────────────────────────────────────────

@router.get(
    "/reports",
    response_model=List[QAReportResponse],
    summary="List all QA reports",
)
def list_qa_reports(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_reports(workspace_id=workspace_id)


@router.post(
    "/reports",
    response_model=QAReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and submit a new QA Report with server-calculated metrics",
)
def create_qa_report(
    workspace_id: str = Path(..., description="Workspace ID"),
    body: QAReportCreate = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_report(workspace_id=workspace_id, payload=body.model_dump(), user_name=user_name)


@router.get(
    "/reports/{report_id}",
    response_model=Dict[str, Any],
    summary="Get detailed QA report snapshot",
)
def get_qa_report_detail(
    workspace_id: str = Path(..., description="Workspace ID"),
    report_id: str = Path(..., description="Report ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_report_detail(workspace_id=workspace_id, report_id=report_id)


@router.get(
    "/release-readiness",
    response_model=ReleaseReadinessResponse,
    summary="Evaluate release readiness gating based on actual test results and open defects",
)
def get_release_readiness(
    workspace_id: str = Path(..., description="Workspace ID"),
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    return qa_service.get_release_readiness(workspace_id=workspace_id)


# ──────────────────────────────────────────────
# 10. PM Clarification Requests
# ──────────────────────────────────────────────

@router.post(
    "/clarifications",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Submit requirement clarification request to the PM",
)
def request_clarification(
    workspace_id: str = Path(..., description="Workspace ID"),
    payload: Dict[str, Any] = ...,
    current_user=Depends(get_current_user),
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    user_name = current_user.get("name") or current_user.get("email") or "QA Lead"
    return qa_service.create_clarification(workspace_id=workspace_id, payload=payload, user_name=user_name)

