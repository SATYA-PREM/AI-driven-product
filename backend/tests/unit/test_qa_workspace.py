"""
Unit tests for QA Lead / Tester Workspace:
- QA Dashboard KPI calculation and seeding
- Test assignments retrieval and filtering
- Test plan and suite management
- Test case creation and immutable execution history
- Defect logging, developer fix submission, and retest verification/reopening
- Server-calculated QA reports and release readiness scorecard
- Read-only PRD inspection and PM clarification dispatcher
"""

import pytest
from app.services.qa_service import qa_service
from app.services.developer_service import developer_service
from app.core.constants import (
    TestPlanStatus,
    TestExecutionOutcome,
    DefectSeverity,
    DefectPriority,
    DefectStatus,
    QARecommendationState
)

# Prevent pytest from attempting to collect Enum classes as test suites
TestPlanStatus.__test__ = False
TestExecutionOutcome.__test__ = False


def test_qa_dashboard_and_kpis():
    ws_id = "ws_qa_test_01"
    dash = qa_service.get_dashboard(workspace_id=ws_id, user_id="test_qa_01", email="qa@prodai.app")

    assert dash is not None
    assert "kpis" in dash
    kpis = dash["kpis"]
    assert kpis["assigned_tests"] >= 0
    assert kpis["pending_execution"] >= 0
    assert kpis["failed_tests"] >= 0
    assert kpis["open_defects"] >= 0

    assert "test_queue" in dash
    assert "priority_defects" in dash
    assert "retesting_queue" in dash
    assert "developer_submissions" in dash
    assert "release_readiness" in dash


def test_qa_assignments_and_filters():
    ws_id = "ws_qa_test_02"
    assignments = qa_service.get_assignments(workspace_id=ws_id, user_id="test_qa_02", email="qa@prodai.app")
    assert len(assignments) > 0

    first_asn = assignments[0]
    asn_id = first_asn["assignment_id"]

    detail = qa_service.get_assignment_detail(workspace_id=ws_id, assignment_id=asn_id)
    assert detail is not None
    assert detail["assignment_id"] == asn_id
    assert "test_cases" in detail
    assert "defects" in detail


def test_qa_test_plans_and_suites():
    ws_id = "ws_qa_test_03"
    
    # 1. Create Test Plan
    plan_payload = {
        "title": "Sprint 24 Quality Strategy",
        "description": "Comprehensive regression and functional test suite for core checkout engine.",
        "feature_name": "Checkout Flow",
        "prd_id": "PRD-CORE-001",
        "prd_version": "1.0",
        "test_environment": "Staging",
        "test_types": ["FUNCTIONAL", "REGRESSION", "SECURITY"],
        "entry_criteria": "All unit tests pass; API deployed on staging cluster.",
        "exit_criteria": "0 Critical or High defects; 100% test case pass rate.",
        "planned_start_date": "2026-10-15",
        "planned_completion_date": "2026-10-20",
    }
    plan = qa_service.create_test_plan(workspace_id=ws_id, payload=plan_payload, user_name="QA Lead Satya")
    assert plan["plan_id"] is not None
    assert plan["status"] == TestPlanStatus.READY.value

    # Update Plan Status
    updated_plan = qa_service.update_test_plan_status(
        workspace_id=ws_id,
        plan_id=plan["plan_id"],
        status=TestPlanStatus.IN_PROGRESS.value,
        user_name="QA Lead Satya"
    )
    assert updated_plan["status"] == TestPlanStatus.IN_PROGRESS.value

    # 2. Create Test Suite
    suite_payload = {
        "title": "Payment Gateway Integration Suite",
        "feature_name": "Checkout Flow",
        "test_plan_id": plan["plan_id"],
        "test_type": "INTEGRATION",
        "description": "Verify external payment webhook callbacks and idempotency token handling.",
    }
    suite = qa_service.create_test_suite(workspace_id=ws_id, payload=suite_payload, user_name="QA Lead Satya")
    assert suite["suite_id"] is not None
    assert suite["test_plan_id"] == plan["plan_id"]


def test_qa_test_case_and_immutable_executions():
    ws_id = "ws_qa_test_04"
    qa_service._ensure_qa_seed_data(ws_id)

    # 1. Create Test Case with step definitions
    tc_payload = {
        "title": "Verify idempotency prevents double charge on rapid clicks",
        "description": "Ensure double clicks on Pay Now generate only a single transaction.",
        "feature_name": "One-click Checkout",
        "prd_id": "PRD-CHECKOUT-001",
        "prd_version": "1.0",
        "acceptance_criterion_id": "AC-01",
        "test_type": "FUNCTIONAL",
        "priority": "HIGH",
        "environment": "Staging",
        "preconditions": "User has logged in and has items in cart.",
        "steps": [
            {"step_number": 1, "action": "Click Pay Now button twice within 200ms", "expected_result": "Second click is disabled, only one token generated"},
            {"step_number": 2, "action": "Inspect network payload for Idempotency-Key", "expected_result": "Single POST /charge with unique key"},
        ],
        "expected_results": "Single charge record created; duplicate charge blocked.",
    }
    tc = qa_service.create_test_case(workspace_id=ws_id, payload=tc_payload, user_name="QA Lead Satya")
    tc_id = tc["test_case_id"]
    assert tc_id is not None
    assert tc["latest_outcome"] == TestExecutionOutcome.NOT_EXECUTED.value

    # 2. Execute Attempt 1 (FAIL)
    exec1_payload = {
        "test_case_id": tc_id,
        "outcome": TestExecutionOutcome.FAILED.value,
        "environment": "Staging",
        "execution_notes": "Second click fired a duplicate request resulting in two order entries.",
        "duration_seconds": 45,
        "actual_results": "Duplicate order created with ID #99102",
        "step_results": [
            {"step_number": 1, "status": "FAIL", "notes": "Double click was allowed by UI button"},
            {"step_number": 2, "status": "FAIL", "notes": "Two separate POST calls issued with differing keys"},
        ],
        "evidence_attachments": ["https://s3.amazonaws.com/evidence/duplicate_charge_network.png"],
    }
    exec1 = qa_service.execute_test_case(
        workspace_id=ws_id,
        test_case_id=tc_id,
        payload=exec1_payload,
        user_name="QA Lead Satya",
        user_id="qa_tester_01"
    )
    assert exec1["execution_id"] is not None
    assert exec1["attempt_number"] == 1
    assert exec1["outcome"] == TestExecutionOutcome.FAILED.value

    # Check that test case latest_outcome updated to FAILED
    updated_tc = qa_service.get_test_case(workspace_id=ws_id, test_case_id=tc_id)
    assert updated_tc["latest_outcome"] == TestExecutionOutcome.FAILED.value
    assert updated_tc["execution_count"] == 1

    # 3. Execute Attempt 2 (PASS after fix)
    exec2_payload = {
        "test_case_id": tc_id,
        "outcome": TestExecutionOutcome.PASSED.value,
        "environment": "Staging",
        "execution_notes": "Button is disabled immediately upon click and debounced properly.",
        "duration_seconds": 30,
        "actual_results": "Single order created #99105, second click prevented.",
        "step_results": [
            {"step_number": 1, "status": "PASS", "notes": "UI disabled button immediately"},
            {"step_number": 2, "status": "PASS", "notes": "Single POST request recorded"},
        ],
    }
    exec2 = qa_service.execute_test_case(
        workspace_id=ws_id,
        test_case_id=tc_id,
        payload=exec2_payload,
        user_name="QA Lead Satya",
        user_id="qa_tester_01"
    )
    assert exec2["execution_id"] != exec1["execution_id"]
    assert exec2["attempt_number"] == 2
    assert exec2["outcome"] == TestExecutionOutcome.PASSED.value

    # History preservation check: Both executions exist and remain immutable
    history = qa_service.get_test_executions(workspace_id=ws_id, test_case_id=tc_id)
    assert len(history) == 2
    attempts = [h["attempt_number"] for h in history]
    assert 1 in attempts and 2 in attempts

    # Final test case status check
    final_tc = qa_service.get_test_case(workspace_id=ws_id, test_case_id=tc_id)
    assert final_tc["latest_outcome"] == TestExecutionOutcome.PASSED.value
    assert final_tc["execution_count"] == 2


def test_qa_defect_lifecycle_and_retesting():
    ws_id = "ws_qa_test_05"
    qa_service._ensure_qa_seed_data(ws_id)

    # 1. Log a Defect
    defect_payload = {
        "title": "Webhook race condition causes duplicate invoice generation",
        "description": "When Stripe sends simultaneous payment and invoice events, duplicate PDFs are generated.",
        "severity": DefectSeverity.CRITICAL.value,
        "priority": DefectPriority.P1.value,
        "feature_name": "Invoice Dispatcher",
        "prd_id": "PRD-INV-001",
        "reproduction_steps": "1. Send event A. 2. Send event B within 50ms.",
        "expected_behavior": "A single invoice should be generated.",
        "actual_behavior": "Two invoice records exist with identical numbering.",
        "environment": "Staging",
        "assigned_to": "Developer Alex",
    }
    defect = qa_service.create_defect(workspace_id=ws_id, payload=defect_payload, user_name="QA Lead Satya")
    def_id = defect["defect_id"]
    assert def_id is not None
    assert defect["status"] == DefectStatus.OPEN.value

    # 2. Developer Submits Fix (transitions to FIX_SUBMITTED)
    developer_service.submit_defect_fix(
        workspace_id=ws_id,
        defect_id=def_id,
        payload={
            "fix_summary": "Added Postgres advisory lock around invoice creation pipeline.",
            "pr_url": "https://github.com/org/repo/pull/44",
            "commit_sha": "def1234",
            "retest_instructions": "Send simultaneous webhook events and verify only one invoice created.",
        },
        user_name="Developer Alex"
    )

    # 3. Defect appears in Retesting Queue
    retest_queue = qa_service.get_retesting_queue(workspace_id=ws_id)
    retest_ids = [d["defect_id"] for d in retest_queue]
    assert def_id in retest_ids

    # 4. QA Retests and Verifies (Closes defect)
    verify_payload = {
        "verification_notes": "Tested simultaneous webhook firing 10 times. Advisory lock successfully deduplicated all invoices.",
        "test_evidence": ["https://s3.amazonaws.com/evidence/webhook_dedup_log.txt"],
        "passed": True,
    }
    verified_defect = qa_service.verify_defect(
        workspace_id=ws_id,
        defect_id=def_id,
        payload=verify_payload,
        user_name="QA Lead Satya"
    )
    assert verified_defect["status"] == DefectStatus.VERIFIED.value
    assert verified_defect["verification_notes"] is not None

    # 5. Defect is removed from Retesting Queue
    retest_queue_after = qa_service.get_retesting_queue(workspace_id=ws_id)
    assert def_id not in [d["defect_id"] for d in retest_queue_after]


def test_qa_defect_reopen_on_failed_retest():
    ws_id = "ws_qa_test_06"
    qa_service._ensure_qa_seed_data(ws_id)

    # Log Defect
    defect = qa_service.create_defect(
        workspace_id=ws_id,
        payload={
            "title": "Session token not cleared on explicit logout",
            "description": "After clicking Logout, old bearer token continues to authenticate requests.",
            "severity": DefectSeverity.HIGH.value,
            "priority": DefectPriority.P1.value,
            "assigned_to": "Developer Alex",
        },
        user_name="QA Lead Satya"
    )
    def_id = defect["defect_id"]

    # Developer submits fix
    developer_service.submit_defect_fix(
        workspace_id=ws_id,
        defect_id=def_id,
        payload={
            "fix_summary": "Added token blacklist in Redis with TTL.",
            "pr_url": "https://github.com/org/repo/pull/55",
        },
        user_name="Developer Alex"
    )

    # Retest Fails -> Reopen
    reopen_payload = {
        "verification_notes": "Token is blacklisted in memory but Redis cluster failover still allows cached tokens.",
        "passed": False,
    }
    reopened = qa_service.verify_defect(
        workspace_id=ws_id,
        defect_id=def_id,
        payload=reopen_payload,
        user_name="QA Lead Satya"
    )
    assert reopened["status"] == DefectStatus.REOPENED.value


def test_qa_report_and_release_readiness():
    ws_id = "ws_qa_test_07"
    qa_service._ensure_qa_seed_data(ws_id)

    # 1. Generate QA Report
    report_payload = {
        "report_title": "Release Candidate 1.4 QA Sign-Off Assessment",
        "feature_name": "One-click Checkout",
        "prd_id": "PRD-CHECKOUT-001",
        "executive_summary": "Completed functional and integration runs for RC 1.4. All critical payment paths verified.",
        "qa_recommendation": QARecommendationState.QA_PASSED.value,
        "known_issues": ["Minor cosmetic glitch on safari mobile back button"],
        "risks_and_mitigations": "Low risk; edge-case only triggers on older Safari browsers.",
    }
    report = qa_service.create_qa_report(
        workspace_id=ws_id,
        payload=report_payload,
        user_name="QA Lead Satya"
    )
    assert report["report_id"] is not None
    assert "metrics_snapshot" in report
    assert report["metrics_snapshot"]["total_test_cases"] >= 0
    assert report["qa_recommendation"] == QARecommendationState.QA_PASSED.value

    # 2. Check Release Readiness Scorecard
    readiness = qa_service.get_release_readiness(workspace_id=ws_id)
    assert "is_release_ready" in readiness
    assert "release_verdict" in readiness
    assert "readiness_score" in readiness
    assert "checklist" in readiness
    assert "blockers" in readiness


def test_qa_read_only_prds_and_clarification():
    ws_id = "ws_qa_test_08"
    qa_service._ensure_qa_seed_data(ws_id)

    # 1. Fetch read-only PRDs
    prds = qa_service.get_assigned_prds(workspace_id=ws_id)
    assert len(prds) > 0
    first_prd = prds[0]
    assert "problem_statement" in first_prd
    assert "acceptance_criteria" in first_prd
    assert "functional_requirements" in first_prd

    # 2. Dispatch Clarification to PM
    clar_payload = {
        "prd_id": first_prd["prd_id"],
        "requirement_id": "REQ-01",
        "subject": "Timeout behavior for external payment provider",
        "question": "What is the acceptable timeout threshold before failing the transaction?",
        "suggested_resolution": "Recommend setting timeout to 10 seconds with user notification.",
        "urgency": "HIGH",
    }
    clar = qa_service.request_pm_clarification(
        workspace_id=ws_id,
        payload=clar_payload,
        user_name="QA Lead Satya",
        user_id="qa_tester_01"
    )
    assert clar["clarification_id"] is not None
    assert clar["status"] == "PENDING_PM_RESPONSE"

