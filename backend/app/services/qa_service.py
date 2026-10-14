"""
qa_service.py
-------------
Authoritative service for the QA Lead (Tester) Workspace:
- Test Plans & Test Suites orchestration
- Test Case management linked to PRD requirements and acceptance criteria
- Execution tracking with immutable historical attempts and evidence
- Defect lifecycle management: Open -> Fix Submitted -> Retest -> Verified -> Closed
- Retesting queue & regression test suite management
- QA reporting with server-calculated metrics and release readiness gating
- Audit logging & role permission enforcement
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.core.database import (
    test_plans_collection,
    test_suites_collection,
    test_cases_collection,
    test_executions_collection,
    defects_collection,
    qa_reports_collection,
    qa_audit_collection,
    prd_assignments_collection,
    prd_projects_collection,
    prd_requirements_collection,
    acceptance_criteria_collection,
    implementation_submissions_collection,
    clarification_requests_collection,
    product_features_collection,
)
from app.services.prd_assignment_service import prd_assignment_service
from app.core.constants import ProductTeamRole, TestExecutionOutcome, DefectSeverity, DefectPriority, DefectStatus, QARecommendationState
from app.core.exceptions import NotFoundError, ValidationError, AuthorizationError


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class QAService:
    """Service providing end-to-end functionality for the QA Lead / Tester Workspace."""

    def _ensure_qa_seed_data(self, workspace_id: str) -> None:
        """Seeds realistic QA assignments, test plans, test suites, test cases, and defects if none exist."""
        prd_assignment_service._ensure_role_assignments_exist(
            workspace_id=workspace_id,
            target_role=ProductTeamRole.QA.value,
        )

        ws_suffix = workspace_id[-4:] if len(workspace_id) >= 4 else "01"
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        # 1. Ensure PRD and Requirement baseline
        prds = list(prd_projects_collection.find(ws_query))
        prd_id = prds[0].get("prd_id", "PRD-001") if prds else "PRD-001"
        req_id = "REQ-PAYMENT-RECOVERY"

        # 2. Ensure Test Plan exists
        plan_count = test_plans_collection.count_documents(ws_query)
        plan_id = f"PLAN-{ws_suffix}-01"
        if plan_count == 0:
            plan_doc = {
                "plan_id": plan_id,
                "name": "Sprint 14 Core Functional & Payment Flow Test Plan",
                "description": "Comprehensive validation plan for payment retry idempotency, session tokens, and analytics telemetry.",
                "workspace_id": workspace_id,
                "feature_scope": "Interactive Payment Failure & Zero-Latency Retry",
                "prd_version": "v1.2",
                "test_objectives": "Verify zero duplicate billing under network flapping; ensure sub-100ms UI feedback; validate WCAG AA accessibility.",
                "test_environment": "Staging (Node.js 20, Postgres, Redis)",
                "test_types": ["FUNCTIONAL", "API_VALIDATION", "REGRESSION", "SECURITY", "ACCESSIBILITY"],
                "entry_criteria": "Developer pull requests approved; staging deploy passes automated smoke tests.",
                "exit_criteria": "100% P1 test cases passed; 0 open Critical/High defects; PM approval on UX conformance.",
                "test_owner": "Satya Prem (QA Lead)",
                "planned_start_date": "2026-10-10",
                "planned_completion_date": "2026-10-24",
                "status": "IN_PROGRESS",
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
            test_plans_collection.insert_one(plan_doc)

        # 3. Ensure Test Suites exist
        suite_count = test_suites_collection.count_documents(ws_query)
        suite_id_1 = f"SUITE-{ws_suffix}-01"
        suite_id_2 = f"SUITE-{ws_suffix}-02"
        if suite_count == 0:
            suites = [
                {
                    "suite_id": suite_id_1,
                    "suite_name": "Checkout & Payment Idempotency Suite",
                    "description": "Critical transaction path validation, network timeouts, and concurrent retry debouncing.",
                    "workspace_id": workspace_id,
                    "plan_id": plan_id,
                    "related_feature": "Interactive Payment Failure & Zero-Latency Retry",
                    "test_case_ids": [f"TC-{ws_suffix}-01", f"TC-{ws_suffix}-02", f"TC-{ws_suffix}-03"],
                    "owner": "Satya Prem (QA Lead)",
                    "execution_status": "IN_PROGRESS",
                    "last_execution": _now_iso(),
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
                {
                    "suite_id": suite_id_2,
                    "suite_name": "Security & Session Renewal Regression Suite",
                    "description": "OAuth token refresh, cross-site CSRF validation, and RBAC workspace boundaries.",
                    "workspace_id": workspace_id,
                    "plan_id": plan_id,
                    "related_feature": "Authentication & Session Security",
                    "test_case_ids": [f"TC-{ws_suffix}-04", f"TC-{ws_suffix}-05"],
                    "owner": "Satya Prem (QA Lead)",
                    "execution_status": "COMPLETED",
                    "last_execution": _now_iso(),
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
            ]
            test_suites_collection.insert_many(suites)

        # 4. Ensure Test Cases exist
        tc_count = test_cases_collection.count_documents(ws_query)
        if tc_count == 0:
            test_cases = [
                {
                    "test_case_id": f"TC-{ws_suffix}-01",
                    "workspace_id": workspace_id,
                    "title": "Zero-Latency Card Retry with Secondary Payment Method",
                    "description": "Verify fallback card triggers instant payment attempt without page reload or state loss.",
                    "prd_id": prd_id,
                    "prd_version": "v1.2",
                    "requirement_id": req_id,
                    "criterion_id": "AC-PAYMENT-01",
                    "preconditions": "User has logged in with at least two registered payment methods on file in Staging environment.",
                    "steps": [
                        {"step_number": 1, "action": "Trigger deliberate card decline using test card 4000-0000-0000-0002", "expected_result": "Decline banner surfaces with 'Retry with Secondary Card' CTA in < 150ms."},
                        {"step_number": 2, "action": "Click 'Retry with Secondary Card'", "expected_result": "Immediate retry spinner initiates without navigating away or losing form state."},
                        {"step_number": 3, "action": "Verify charge response on secondary card", "expected_result": "Payment succeeds; confirmation modal displays charge receipt."},
                    ],
                    "expected_results": "Secondary payment succeeds seamlessly; order state transitions to PAID with sub-200ms latency.",
                    "test_data_requirements": "Test customer account with Visa and Mastercard test tokens.",
                    "test_type": "FUNCTIONAL",
                    "priority": "P1",
                    "environment": "Staging",
                    "owner": "Satya Prem (QA Lead)",
                    "status": "ACTIVE",
                    "latest_outcome": "PASSED",
                    "execution_count": 2,
                    "suite_id": suite_id_1,
                    "plan_id": plan_id,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
                {
                    "test_case_id": f"TC-{ws_suffix}-02",
                    "workspace_id": workspace_id,
                    "title": "Idempotency Protection on Rapid Concurrent Retries",
                    "description": "Ensure rapid double-clicks on the retry button generate single idempotent charge token.",
                    "prd_id": prd_id,
                    "prd_version": "v1.2",
                    "requirement_id": req_id,
                    "criterion_id": "AC-PAYMENT-02",
                    "preconditions": "Network throttling set to Slow 3G; checkout modal open.",
                    "steps": [
                        {"step_number": 1, "action": "Open payment failure recovery dialog", "expected_result": "Retry button enabled."},
                        {"step_number": 2, "action": "Click 'Retry Payment' 3 times in rapid succession (< 100ms interval)", "expected_result": "Button immediately enters disabled state after first tap."},
                        {"step_number": 3, "action": "Inspect HTTP requests in DevTools network tab", "expected_result": "Exactly 1 POST request dispatched with unique X-Idempotency-Key header."},
                    ],
                    "expected_results": "Client suppresses redundant click dispatches; server responds with 200 OK and exactly one charge event.",
                    "test_data_requirements": "Pre-staged test card with simulated 1500ms network latency.",
                    "test_type": "INTEGRATION",
                    "priority": "P1",
                    "environment": "Staging",
                    "owner": "Satya Prem (QA Lead)",
                    "status": "ACTIVE",
                    "latest_outcome": "FAILED",
                    "execution_count": 3,
                    "suite_id": suite_id_1,
                    "plan_id": plan_id,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
                {
                    "test_case_id": f"TC-{ws_suffix}-03",
                    "workspace_id": workspace_id,
                    "title": "Payment Recovery Screen WCAG 2.1 AA Contrast and Screen Reader Announce",
                    "description": "Audit accessibility compliance of failure dialog, ARIA live regions, and keyboard focus trapping.",
                    "prd_id": prd_id,
                    "prd_version": "v1.2",
                    "requirement_id": req_id,
                    "criterion_id": "AC-PAYMENT-03",
                    "preconditions": "Screen reader active (NVDA/VoiceOver); keyboard navigation only.",
                    "steps": [
                        {"step_number": 1, "action": "Trigger payment failure modal via keyboard TAB navigation", "expected_result": "Focus trapped inside modal; initial focus set to decline message."},
                        {"step_number": 2, "action": "Inspect aria-live announcement", "expected_result": "Screen reader announces: 'Payment failed. Please choose an alternate card.'"},
                        {"step_number": 3, "action": "Verify text contrast ratio against background", "expected_result": "All text passes minimum 4.5:1 ratio for normal text and 3:1 for large text."},
                    ],
                    "expected_results": "Full keyboard navigation cycle works; zero axe-core accessibility violations.",
                    "test_data_requirements": "Standard test browser with axe-core extension.",
                    "test_type": "ACCESSIBILITY",
                    "priority": "P2",
                    "environment": "Staging",
                    "owner": "Satya Prem (QA Lead)",
                    "status": "ACTIVE",
                    "latest_outcome": "PASSED",
                    "execution_count": 1,
                    "suite_id": suite_id_1,
                    "plan_id": plan_id,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
                {
                    "test_case_id": f"TC-{ws_suffix}-04",
                    "workspace_id": workspace_id,
                    "title": "OAuth 2.0 Refresh Token Silent Renewal During Active QA Session",
                    "description": "Ensure expired access token refreshes seamlessly without interrupting background test executions.",
                    "prd_id": prd_id,
                    "prd_version": "v1.2",
                    "requirement_id": "REQ-AUTH-RENEWAL",
                    "criterion_id": "AC-AUTH-01",
                    "preconditions": "Session token TTL configured to 60 seconds in staging test harness.",
                    "steps": [
                        {"step_number": 1, "action": "Initiate long-running test execution batch", "expected_result": "Batch starts running."},
                        {"step_number": 2, "action": "Wait 65 seconds for token expiration", "expected_result": "Token expires silently in memory."},
                        {"step_number": 3, "action": "Submit test execution result payload", "expected_result": "Interceptor fetches new token via refresh cookie and retries payload without 401 error."},
                    ],
                    "expected_results": "Zero user-facing 401 Unauthorized errors during active execution.",
                    "test_data_requirements": "Test account with refresh token cookie.",
                    "test_type": "SECURITY",
                    "priority": "P2",
                    "environment": "Staging",
                    "owner": "Satya Prem (QA Lead)",
                    "status": "ACTIVE",
                    "latest_outcome": "PASSED",
                    "execution_count": 1,
                    "suite_id": suite_id_2,
                    "plan_id": plan_id,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
                {
                    "test_case_id": f"TC-{ws_suffix}-05",
                    "workspace_id": workspace_id,
                    "title": "Cross-Workspace Data Isolation Under Concurrent Tenant Requests",
                    "description": "Verify workspace B cannot read or execute test cases belonging to workspace A.",
                    "prd_id": prd_id,
                    "prd_version": "v1.2",
                    "requirement_id": "REQ-AUTH-RENEWAL",
                    "criterion_id": "AC-AUTH-02",
                    "preconditions": "Two distinct workspaces created with separate membership lists.",
                    "steps": [
                        {"step_number": 1, "action": "Authenticate as Member of Workspace A", "expected_result": "Auth successful."},
                        {"step_number": 2, "action": "Send GET /api/v1/workspaces/{Workspace_B}/qa/test-cases", "expected_result": "Server rejects request with 403 Forbidden."},
                    ],
                    "expected_results": "Backend enforces strict workspace tenancy boundaries on every route.",
                    "test_data_requirements": "Multi-tenant test accounts.",
                    "test_type": "SECURITY",
                    "priority": "P1",
                    "environment": "Staging",
                    "owner": "Satya Prem (QA Lead)",
                    "status": "ACTIVE",
                    "latest_outcome": "NOT_EXECUTED",
                    "execution_count": 0,
                    "suite_id": suite_id_2,
                    "plan_id": plan_id,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                },
            ]
            test_cases_collection.insert_many(test_cases)

        # 5. Ensure Test Executions exist (providing audit history)
        exec_count = test_executions_collection.count_documents(ws_query)
        if exec_count == 0:
            exec_doc = {
                "execution_id": f"EXEC-{uuid.uuid4().hex[:8].upper()}",
                "test_case_id": f"TC-{ws_suffix}-02",
                "test_case_title": "Idempotency Protection on Rapid Concurrent Retries",
                "workspace_id": workspace_id,
                "feature_id": "FEAT-PAYMENT-RECOVERY",
                "prd_id": prd_id,
                "prd_version": "v1.2",
                "environment": "Staging",
                "attempt_number": 1,
                "executed_by": "Satya Prem (QA Lead)",
                "tester_email": "satya@qa",
                "outcome": "FAILED",
                "actual_results": "Multiple rapid clicks bypassed client disable state, producing 2 duplicate charge intents with 120ms gap.",
                "step_results": [
                    {"step_number": 1, "status": "PASSED", "actual_result": "Modal opened normally"},
                    {"step_number": 2, "status": "FAILED", "actual_result": "Button remained active during initial dispatch"},
                    {"step_number": 3, "status": "FAILED", "actual_result": "2 POST calls recorded with identical timestamps"},
                ],
                "evidence_notes": "Console log shows: [Telemetry] Dispatch event retry_clicked x2. Server log confirms 2 charge events.",
                "evidence_attachments": ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"],
                "defect_ids": [f"DEF-{ws_suffix}-01"],
                "executed_at": _now_iso(),
                "duration_seconds": 45,
            }
            test_executions_collection.insert_one(exec_doc)

        # 6. Ensure Defect and Retest workflow item exists
        defect_count = defects_collection.count_documents(ws_query)
        if defect_count == 0:
            sample_defect = {
                "defect_id": f"DEF-{ws_suffix}-01",
                "workspace_id": workspace_id,
                "title": "Idempotency key collision on rapid payment retry clicks",
                "description": "Concurrent tap on retry CTA bypasses debounce guard, causing dual charge creation on backend.",
                "feature_id": "FEAT-PAYMENT-RECOVERY",
                "feature_title": "Interactive Payment Failure & Zero-Latency Retry",
                "prd_id": prd_id,
                "prd_version": "v1.2",
                "requirement_id": req_id,
                "criterion_id": "AC-PAYMENT-02",
                "test_case_id": f"TC-{ws_suffix}-02",
                "execution_id": f"EXEC-{ws_suffix}-01",
                "severity": "CRITICAL",
                "priority": "P1",
                "environment": "Staging",
                "build_reference": "build-stg-412.commit-a94f1c",
                "preconditions": "Expired test card on file; network delay 300ms.",
                "steps_to_reproduce": [
                    "Open checkout modal with expired card",
                    "Click 'Retry with Secondary Card' rapidly 3 times within 200ms",
                    "Observe duplicate pending charge events in telemetry payload",
                ],
                "expected_result": "Client and backend enforce unique idempotency token per retry attempt, debouncing concurrent submissions.",
                "actual_result": "Two charges initiated simultaneously before first response completes.",
                "reproducibility": "ALWAYS",
                "supporting_evidence": "Logs show 2 POST /api/v1/checkout/retry calls with identical payload timestamp.",
                "reporter": "Satya Prem (QA Lead)",
                "assigned_developer": "Satya Prem (Lead Developer)",
                "status": "FIX_SUBMITTED",  # Ready for QA Retest Queue!
                "reopen_count": 0,
                "fix_reference": "PR #142 - Add useDebouncedCallback and Redis distributed lock on payment_id",
                "fix_notes": "Implemented client-side 1500ms button debounce and server-side SETNX token with 10s TTL.",
                "verification_notes": None,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
            defects_collection.insert_one(sample_defect)

        # 7. Ensure QA Report baseline exists
        report_count = qa_reports_collection.count_documents(ws_query)
        if report_count == 0:
            sample_report = {
                "report_id": f"REP-{ws_suffix}-01",
                "workspace_id": workspace_id,
                "title": "Sprint 14 Final QA Evaluation - Payment Recovery & Core Security",
                "feature_id": "FEAT-PAYMENT-RECOVERY",
                "prd_id": prd_id,
                "prd_version": "v1.2",
                "test_plan_id": plan_id,
                "period_start": "2026-10-10",
                "period_end": "2026-10-14",
                "metrics": {
                    "total_test_cases": 5,
                    "executed_test_cases": 4,
                    "passed_tests": 3,
                    "failed_tests": 1,
                    "blocked_tests": 0,
                    "skipped_tests": 0,
                    "unexecuted_tests": 1,
                    "pass_rate": 75.0,
                    "open_defects_by_severity": {"CRITICAL": 1, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
                },
                "retesting_status": {
                    "awaiting_retest": 1,
                    "verified_fixes": 2,
                    "reopened": 0,
                },
                "requirement_coverage_pct": 80.0,
                "known_limitations": "Redis cluster failover fallback defaults to local in-memory lock during split-brain.",
                "outstanding_risks": "High load (>5000 req/sec) requires re-verification after PR #142 fix is retested.",
                "qa_recommendation": "READY_FOR_REVIEW",
                "author": "Satya Prem (QA Lead)",
                "created_at": _now_iso(),
            }
            qa_reports_collection.insert_one(sample_report)

    # ──────────────────────────────────────────────
    # 1. Dashboard Metrics & Overview
    # ──────────────────────────────────────────────

    def get_dashboard(self, workspace_id: str, user_id: str = "", email: str = "") -> Dict[str, Any]:
        """Calculates authoritative KPI metrics, queues, recent executions, and release readiness."""
        self._ensure_qa_seed_data(workspace_id)
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        # Load collections
        test_cases = list(test_cases_collection.find(ws_query, {"_id": 0}))
        defects = list(defects_collection.find(ws_query, {"_id": 0}))
        executions = list(test_executions_collection.find(ws_query, {"_id": 0}).sort("executed_at", -1))
        submissions = list(implementation_submissions_collection.find(ws_query, {"_id": 0}).sort("submitted_at", -1))
        assignments = self.get_assignments(workspace_id=workspace_id)

        # Central counting rules
        total_test_cases = len(test_cases)
        assigned_tests = len(assignments)
        pending_execution = sum(1 for tc in test_cases if tc.get("latest_outcome") in ["NOT_EXECUTED", None] or tc.get("execution_count", 0) == 0)
        in_progress = sum(1 for tc in test_cases if tc.get("status") == "IN_PROGRESS" or tc.get("latest_outcome") == "BLOCKED")
        failed_tests = sum(1 for tc in test_cases if tc.get("latest_outcome") == "FAILED")
        passed_tests = sum(1 for tc in test_cases if tc.get("latest_outcome") == "PASSED")
        blocked_tests = sum(1 for tc in test_cases if tc.get("latest_outcome") == "BLOCKED")

        # Open defects (excluding CLOSED / VERIFIED)
        open_defect_statuses = ["OPEN", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "FIX_SUBMITTED", "RETEST_PENDING"]
        open_defects = [d for d in defects if str(d.get("status", "")).upper() in open_defect_statuses]
        awaiting_retest = [d for d in defects if str(d.get("status", "")).upper() in ["FIX_SUBMITTED", "RETEST_PENDING"]]
        critical_defects = [d for d in open_defects if str(d.get("severity", "")).upper() == "CRITICAL"]

        # Features awaiting QA review
        features_awaiting_qa = [s for s in submissions if s.get("status") in ["SUBMITTED", "QA_PENDING", "IN_REVIEW"]]

        # Release readiness score
        readiness_score = 0
        if total_test_cases > 0:
            base_pass_pct = (passed_tests / total_test_cases) * 100
            readiness_score = round(max(0, base_pass_pct - (len(critical_defects) * 25)), 1)

        kpis = {
            "assigned_tests": assigned_tests,
            "total_test_cases": total_test_cases,
            "pending_execution": pending_execution,
            "in_progress": in_progress,
            "failed_tests": failed_tests,
            "passed_tests": passed_tests,
            "blocked_tests": blocked_tests,
            "open_defects": len(open_defects),
            "awaiting_retest": len(awaiting_retest),
            "critical_defects": len(critical_defects),
            "features_awaiting_qa": len(features_awaiting_qa),
            "release_readiness_score": readiness_score,
        }

        # Activity stream
        activities = list(qa_audit_collection.find(ws_query, {"_id": 0}).sort("timestamp", -1).limit(10))
        if not activities and executions:
            for ex in executions[:5]:
                activities.append({
                    "action": f"Executed test case {ex.get('test_case_id')}: {ex.get('outcome')}",
                    "user": ex.get("executed_by", "QA Lead"),
                    "timestamp": ex.get("executed_at", _now_iso()),
                    "target_id": ex.get("execution_id"),
                })

        # Release readiness snapshot
        release_summary = {
            "ready_for_release": len(critical_defects) == 0 and failed_tests == 0 and pending_execution == 0,
            "recommendation": "BLOCKED" if len(critical_defects) > 0 else ("QA_PASSED" if failed_tests == 0 and pending_execution == 0 else "TESTING_IN_PROGRESS"),
            "critical_blockers_count": len(critical_defects),
            "unexecuted_count": pending_execution,
        }

        return {
            "workspace_id": workspace_id,
            "kpis": kpis,
            "test_queue": test_cases[:6],
            "testing_queue": test_cases[:6],
            "priority_defects": sorted(open_defects, key=lambda d: (d.get("severity") == "CRITICAL", d.get("priority") == "P1"), reverse=True)[:5],
            "recent_executions": executions[:6],
            "features_awaiting_qa": features_awaiting_qa[:5],
            "developer_submissions": features_awaiting_qa[:5],
            "retesting_queue": awaiting_retest[:5],
            "recent_activity": activities,
            "release_readiness_summary": release_summary,
            "release_readiness": release_summary,
        }

    # ──────────────────────────────────────────────
    # 2. My Test Assignments
    # ──────────────────────────────────────────────

    def get_assignments(
        self,
        workspace_id: str,
        user_id: str = "",
        email: str = "",
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Returns QA testing assignments enriched with PRD requirements, developer submissions, and test case counts."""
        self._ensure_qa_seed_data(workspace_id)

        raw_asns = prd_assignment_service.list_assignments(
            workspace_id=workspace_id,
            team_role=ProductTeamRole.QA.value,
            status=status,
        )

        test_cases = list(test_cases_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
        submissions = list(implementation_submissions_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))
        defects = list(defects_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))

        enriched = []
        for a in raw_asns:
            item = dict(a)
            aid = item.get("assignment_id")
            rid = item.get("requirement_id")

            # Link test cases for this assignment/requirement
            matched_cases = [tc for tc in test_cases if tc.get("requirement_id") == rid or tc.get("assignment_id") == aid]
            item["test_case_count"] = len(matched_cases)
            item["passed_tests"] = sum(1 for tc in matched_cases if tc.get("latest_outcome") == "PASSED")
            item["failed_tests"] = sum(1 for tc in matched_cases if tc.get("latest_outcome") == "FAILED")
            item["pending_tests"] = sum(1 for tc in matched_cases if tc.get("latest_outcome") in ["NOT_EXECUTED", None])

            # Link latest developer submission
            sub = next((s for s in submissions if s.get("requirement_id") == rid or s.get("assignment_id") == aid), None)
            if sub and "_id" in sub:
                del sub["_id"]
            item["developer_submission"] = sub

            # Count defects
            task_defects = [d for d in defects if d.get("requirement_id") == rid or d.get("assignment_id") == aid]
            item["open_defects_count"] = sum(1 for d in task_defects if d.get("status") not in ["VERIFIED", "CLOSED"])

            # Responsible tester and due dates
            item["responsible_tester"] = item.get("assigned_to_name") or "Satya Prem (QA Lead)"
            item["due_date"] = item.get("due_date") or "Next Sprint (Day 12)"
            item["priority"] = item.get("priority") or "P1"
            item["testing_status"] = item.get("status") or "IN_PROGRESS"
            item["next_required_action"] = "Execute Test Cases" if item["pending_tests"] > 0 else ("Verify Defect Fixes" if item["open_defects_count"] > 0 else "Submit QA Report")

            enriched.append(item)

        return enriched

    def get_assignment_detail(self, workspace_id: str, assignment_id: str) -> Dict[str, Any]:
        """Returns single assignment with full requirement context, acceptance criteria, and linked tests."""
        assignments = self.get_assignments(workspace_id=workspace_id)
        match = next((a for a in assignments if a.get("assignment_id") == assignment_id), None)
        if not match:
            raise NotFoundError("Assignment", assignment_id)

        # Attach linked test cases
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        rid = match.get("requirement_id")
        linked_cases = list(test_cases_collection.find({
            "$and": [
                ws_query,
                {"$or": [{"requirement_id": rid}, {"assignment_id": assignment_id}]}
            ]
        }, {"_id": 0}))
        match["test_cases"] = linked_cases

        # Attach defects
        linked_defects = list(defects_collection.find({
            "$and": [
                ws_query,
                {"$or": [{"requirement_id": rid}, {"assignment_id": assignment_id}]}
            ]
        }, {"_id": 0}))
        match["defects"] = linked_defects

        return match

    def update_assignment_status(
        self,
        workspace_id: str,
        assignment_id: str,
        new_status: str,
        user_name: str = "QA Lead",
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Enforces QA assignment progression."""
        current = prd_assignments_collection.find_one({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "assignment_id": assignment_id,
        })
        if not current:
            raise NotFoundError("Assignment", assignment_id)

        updates = {
            "status": str(new_status).upper(),
            "updated_at": _now_iso(),
        }
        if notes:
            updates["response"] = notes

        prd_assignments_collection.update_one({"assignment_id": assignment_id}, {"$set": updates})

        # Audit event
        self._record_audit(
            workspace_id=workspace_id,
            action=f"Updated QA assignment {assignment_id} status to {new_status}",
            user=user_name,
            target_id=assignment_id,
        )

        return self.get_assignment_detail(workspace_id=workspace_id, assignment_id=assignment_id)

    # ──────────────────────────────────────────────
    # 3. Read-Only Requirements & Acceptance Criteria
    # ──────────────────────────────────────────────

    def get_requirements(self, workspace_id: str, prd_id: Optional[str] = None) -> Dict[str, Any]:
        """Read-only requirement inspection with acceptance criteria and execution status."""
        self._ensure_qa_seed_data(workspace_id)
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        prds = list(prd_projects_collection.find(ws_query, {"_id": 0}))
        target_prd = next((p for p in prds if p.get("prd_id") == prd_id), prds[0] if prds else {})

        target_prd_id = target_prd.get("prd_id", "PRD-001")
        reqs = list(prd_requirements_collection.find({"$or": [{"workspace_id": workspace_id}, {"prd_id": target_prd_id}]}, {"_id": 0}))
        test_cases = list(test_cases_collection.find(ws_query, {"_id": 0}))
        defects = list(defects_collection.find(ws_query, {"_id": 0}))

        # If no requirements in collection, synthesize from realistic seed
        if not reqs:
            reqs = [
                {
                    "requirement_id": "REQ-PAYMENT-RECOVERY",
                    "prd_id": target_prd_id,
                    "title": "Zero-Latency Payment Retry Engine",
                    "description": "Provide instant retry CTA on payment decline with idempotency protection and secondary card selection.",
                    "type": "FUNCTIONAL",
                    "priority": "P1",
                    "acceptance_criteria": [
                        {
                            "criterion_id": "AC-PAYMENT-01",
                            "description": "Secondary card retry initiates without page reload.",
                            "expected_behavior": "Modal updates in-place within 150ms.",
                            "preconditions": "Two cards on file.",
                        },
                        {
                            "criterion_id": "AC-PAYMENT-02",
                            "description": "Concurrent retry clicks generate single idempotent charge token.",
                            "expected_behavior": "Client debounces clicks; backend returns duplicate charge prevention header.",
                            "preconditions": "Rapid double-click simulation.",
                        },
                        {
                            "criterion_id": "AC-PAYMENT-03",
                            "description": "WCAG AA contrast and screen-reader announcement.",
                            "expected_behavior": "Screen reader announces failure; focus trapped inside modal.",
                            "preconditions": "Keyboard navigation active.",
                        },
                    ],
                },
                {
                    "requirement_id": "REQ-AUTH-RENEWAL",
                    "prd_id": target_prd_id,
                    "title": "OAuth 2.0 Silent Token Refresh & Multi-Tenant Boundary",
                    "description": "Ensure seamless background token renewal and complete workspace isolation.",
                    "type": "SECURITY",
                    "priority": "P1",
                    "acceptance_criteria": [
                        {
                            "criterion_id": "AC-AUTH-01",
                            "description": "Silent token refresh when TTL expires during test run.",
                            "expected_behavior": "Zero 401 Unauthorized errors observed.",
                            "preconditions": "Token TTL < test batch duration.",
                        },
                        {
                            "criterion_id": "AC-AUTH-02",
                            "description": "Cross-workspace access rejection.",
                            "expected_behavior": "403 Forbidden on foreign workspace IDs.",
                            "preconditions": "Dual workspace membership test accounts.",
                        },
                    ],
                },
            ]

        # Enrich criteria with linked test cases & defects
        for r in reqs:
            rid = r.get("requirement_id")
            for ac in r.get("acceptance_criteria", []):
                acid = ac.get("criterion_id")
                matched_cases = [tc for tc in test_cases if tc.get("criterion_id") == acid or tc.get("requirement_id") == rid]
                matched_defects = [d for d in defects if d.get("criterion_id") == acid or d.get("requirement_id") == rid]

                ac["linked_test_cases"] = matched_cases
                ac["linked_defects"] = matched_defects
                # Criteria is verified ONLY if there is at least 1 passed execution and 0 open defects
                has_pass = any(tc.get("latest_outcome") == "PASSED" for tc in matched_cases)
                has_open_defect = any(d.get("status") not in ["VERIFIED", "CLOSED"] for d in matched_defects)
                ac["verification_status"] = "VERIFIED" if (has_pass and not has_open_defect) else ("FAILED" if has_open_defect else "PENDING_EXECUTION")

        return {
            "workspace_id": workspace_id,
            "prd_overview": {
                "prd_id": target_prd_id,
                "title": target_prd.get("title", "Customer Intelligence & Payment Engine PRD"),
                "version": target_prd.get("version", "v1.2"),
                "status": "APPROVED",
                "problem_statement": "Customers experience 14% cart abandonment on transient payment failures.",
                "product_objective": "Enable sub-200ms recovery flow with zero double-charge risk.",
                "approved_by": "Product Manager",
                "approved_at": "2026-10-08T09:30:00Z",
                "dependencies": ["Stripe API v2024", "Redis 7.2 Idempotency Store"],
                "constraints": ["PCI-DSS Level 1 compliance; no card numbers in frontend logs."],
            },
            "requirements": reqs,
        }

    def get_assigned_prds(self, workspace_id: str, prd_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns list of assigned approved PRD views."""
        data = self.get_requirements(workspace_id=workspace_id, prd_id=prd_id)
        overview = data.get("prd_overview", {})
        overview["requirements"] = data.get("requirements", [])
        overview["acceptance_criteria"] = [ac for req in data.get("requirements", []) for ac in req.get("acceptance_criteria", [])]
        overview["functional_requirements"] = [req for req in data.get("requirements", []) if req.get("type") == "FUNCTIONAL"]
        return [overview]

    # ──────────────────────────────────────────────
    # 4. Test Plans & Test Suites
    # ──────────────────────────────────────────────

    def get_test_plans(self, workspace_id: str) -> List[Dict[str, Any]]:
        self._ensure_qa_seed_data(workspace_id)
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        plans = list(test_plans_collection.find(ws_query, {"_id": 0}).sort("created_at", -1))
        test_cases = list(test_cases_collection.find(ws_query, {"_id": 0}))

        for p in plans:
            pid = p.get("plan_id")
            cases = [tc for tc in test_cases if tc.get("plan_id") == pid]
            p["test_case_count"] = len(cases)
            p["passed_count"] = sum(1 for tc in cases if tc.get("latest_outcome") == "PASSED")
            p["failed_count"] = sum(1 for tc in cases if tc.get("latest_outcome") == "FAILED")
            p["pass_rate"] = round((p["passed_count"] / len(cases)) * 100, 1) if cases else 0.0

        return plans

    def create_test_plan(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        plan_id = f"PLAN-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "plan_id": plan_id,
            "name": payload.get("name") or payload.get("title") or "Sprint Test Plan",
            "description": payload.get("description"),
            "workspace_id": workspace_id,
            "feature_scope": payload.get("feature_scope") or payload.get("feature_name"),
            "prd_version": payload.get("prd_version", "v1.0"),
            "test_objectives": payload.get("test_objectives"),
            "test_environment": payload.get("test_environment", "Staging"),
            "test_types": payload.get("test_types", ["FUNCTIONAL"]),
            "entry_criteria": payload.get("entry_criteria"),
            "exit_criteria": payload.get("exit_criteria"),
            "test_owner": user_name,
            "planned_start_date": payload.get("planned_start_date"),
            "planned_completion_date": payload.get("planned_completion_date"),
            "status": payload.get("status", "READY"),
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }
        test_plans_collection.insert_one(doc)
        if "_id" in doc:
            del doc["_id"]

        self._record_audit(workspace_id, f"Created test plan '{doc['name']}'", user_name, plan_id)
        return doc

    def update_test_plan_status(self, workspace_id: str, plan_id: str, status: str, user_name: str = "QA Lead") -> Dict[str, Any]:
        return self.update_test_plan(workspace_id=workspace_id, plan_id=plan_id, payload={"status": status}, user_name=user_name)

    def update_test_plan(self, workspace_id: str, plan_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}], "plan_id": plan_id}
        plan = test_plans_collection.find_one(ws_query)
        if not plan:
            raise NotFoundError("Test Plan", plan_id)

        clean_updates = {k: v for k, v in payload.items() if v is not None}
        clean_updates["updated_at"] = _now_iso()

        test_plans_collection.update_one({"plan_id": plan_id}, {"$set": clean_updates})
        self._record_audit(workspace_id, f"Updated test plan {plan_id}", user_name, plan_id)

        updated = test_plans_collection.find_one({"plan_id": plan_id}, {"_id": 0})
        return updated

    def get_test_suites(self, workspace_id: str, plan_id: Optional[str] = None) -> List[Dict[str, Any]]:
        self._ensure_qa_seed_data(workspace_id)
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        if plan_id:
            query["plan_id"] = plan_id

        suites = list(test_suites_collection.find(query, {"_id": 0}).sort("created_at", -1))
        test_cases = list(test_cases_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))

        for s in suites:
            sid = s.get("suite_id")
            cases = [tc for tc in test_cases if tc.get("suite_id") == sid or tc.get("test_case_id") in s.get("test_case_ids", [])]
            s["test_case_count"] = len(cases)
            s["pass_count"] = sum(1 for tc in cases if tc.get("latest_outcome") == "PASSED")
            s["fail_count"] = sum(1 for tc in cases if tc.get("latest_outcome") == "FAILED")
            s["blocked_count"] = sum(1 for tc in cases if tc.get("latest_outcome") == "BLOCKED")

        return suites

    def create_test_suite(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        suite_id = f"SUITE-{uuid.uuid4().hex[:6].upper()}"
        plan_id = payload.get("plan_id") or payload.get("test_plan_id")
        doc = {
            "suite_id": suite_id,
            "suite_name": payload.get("suite_name") or payload.get("title") or "Test Suite",
            "description": payload.get("description"),
            "workspace_id": workspace_id,
            "plan_id": plan_id,
            "test_plan_id": plan_id,
            "related_feature": payload.get("related_feature") or payload.get("feature_name"),
            "test_case_ids": payload.get("test_case_ids", []),
            "owner": user_name,
            "execution_status": "PENDING",
            "last_execution": None,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }
        test_suites_collection.insert_one(doc)
        if "_id" in doc:
            del doc["_id"]

        self._record_audit(workspace_id, f"Created test suite '{doc['suite_name']}'", user_name, suite_id)
        return doc

    # ──────────────────────────────────────────────
    # 5. Test Cases
    # ──────────────────────────────────────────────

    def get_test_cases(
        self,
        workspace_id: str,
        suite_id: Optional[str] = None,
        requirement_id: Optional[str] = None,
        priority: Optional[str] = None,
        test_type: Optional[str] = None,
        outcome: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        self._ensure_qa_seed_data(workspace_id)
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        if suite_id:
            query["suite_id"] = suite_id
        if requirement_id:
            query["requirement_id"] = requirement_id
        if priority:
            query["priority"] = priority.upper()
        if test_type:
            query["test_type"] = test_type.upper()
        if outcome:
            query["latest_outcome"] = outcome.upper()

        return list(test_cases_collection.find(query, {"_id": 0}).sort("created_at", -1))

    def get_test_case_detail(self, workspace_id: str, test_case_id: str) -> Dict[str, Any]:
        self._ensure_qa_seed_data(workspace_id)
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}], "test_case_id": test_case_id}
        tc = test_cases_collection.find_one(query, {"_id": 0})
        if not tc:
            raise NotFoundError("Test Case", test_case_id)

        # Attach execution history
        executions = list(test_executions_collection.find({"test_case_id": test_case_id}, {"_id": 0}).sort("executed_at", -1))
        tc["execution_history"] = executions

        # Attach defects
        defects = list(defects_collection.find({"test_case_id": test_case_id}, {"_id": 0}).sort("created_at", -1))
        tc["linked_defects"] = defects

        return tc

    get_test_case = get_test_case_detail

    def create_test_case(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        cid = f"TC-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "test_case_id": cid,
            "workspace_id": workspace_id,
            "title": payload.get("title"),
            "description": payload.get("description"),
            "prd_id": payload.get("prd_id", "PRD-001"),
            "prd_version": payload.get("prd_version", "v1.0"),
            "requirement_id": payload.get("requirement_id"),
            "criterion_id": payload.get("criterion_id"),
            "preconditions": payload.get("preconditions"),
            "steps": payload.get("steps", []),
            "expected_results": payload.get("expected_results"),
            "test_data_requirements": payload.get("test_data_requirements"),
            "test_type": str(payload.get("test_type", "FUNCTIONAL")).upper(),
            "priority": str(payload.get("priority", "P2")).upper(),
            "environment": payload.get("environment", "Staging"),
            "owner": user_name,
            "status": "ACTIVE",
            "latest_outcome": "NOT_EXECUTED",
            "execution_count": 0,
            "suite_id": payload.get("suite_id"),
            "plan_id": payload.get("plan_id"),
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }
        test_cases_collection.insert_one(doc)
        if "_id" in doc:
            del doc["_id"]

        self._record_audit(workspace_id, f"Created test case {cid}: '{doc['title']}'", user_name, cid)
        return doc

    def update_test_case(self, workspace_id: str, test_case_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}], "test_case_id": test_case_id}
        tc = test_cases_collection.find_one(query)
        if not tc:
            raise NotFoundError("Test Case", test_case_id)

        clean_updates = {k: v for k, v in payload.items() if v is not None}
        clean_updates["updated_at"] = _now_iso()

        test_cases_collection.update_one({"test_case_id": test_case_id}, {"$set": clean_updates})
        self._record_audit(workspace_id, f"Updated test case {test_case_id}", user_name, test_case_id)

        return self.get_test_case_detail(workspace_id, test_case_id)

    # ──────────────────────────────────────────────
    # 6. Test Execution
    # ──────────────────────────────────────────────

    def execute_test_case(
        self,
        workspace_id: str,
        test_case_id: str,
        payload: Dict[str, Any],
        user_name: str = "QA Lead",
        user_email: str = "",
        user_id: str = "",
    ) -> Dict[str, Any]:
        """
        Executes a test case and records an immutable historical attempt:
        - Validates test case exists
        - Records actual result and step outcomes
        - Preserves prior attempts
        - Updates latest test case outcome and execution count
        - Emits audit event
        """
        tc = test_cases_collection.find_one({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "test_case_id": test_case_id,
        })
        if not tc:
            raise NotFoundError("Test Case", test_case_id)

        outcome = str(payload.get("outcome", "PASSED")).upper()
        if outcome not in ["PASSED", "FAILED", "BLOCKED", "NOT_EXECUTED", "SKIPPED"]:
            raise ValidationError(f"Invalid execution outcome: {outcome}")

        # Attempt index
        prev_executions = test_executions_collection.count_documents({"test_case_id": test_case_id})
        attempt = prev_executions + 1

        exec_id = f"EXEC-{uuid.uuid4().hex[:8].upper()}"
        doc = {
            "execution_id": exec_id,
            "test_case_id": test_case_id,
            "test_case_title": tc.get("title"),
            "workspace_id": workspace_id,
            "feature_id": tc.get("feature_id") or "FEAT-PAYMENT-RECOVERY",
            "prd_id": tc.get("prd_id"),
            "prd_version": tc.get("prd_version", "v1.0"),
            "environment": payload.get("environment") or tc.get("environment", "Staging"),
            "attempt_number": attempt,
            "executed_by": user_name,
            "tester_email": user_email,
            "outcome": outcome,
            "actual_results": payload.get("actual_results", ""),
            "step_results": payload.get("step_results", []),
            "evidence_notes": payload.get("evidence_notes"),
            "evidence_attachments": payload.get("evidence_attachments", []),
            "defect_ids": [],
            "executed_at": _now_iso(),
            "duration_seconds": payload.get("duration_seconds", 30),
        }

        test_executions_collection.insert_one(doc)

        # Update test case's aggregate metrics
        test_cases_collection.update_one(
            {"test_case_id": test_case_id},
            {
                "$set": {
                    "latest_outcome": outcome,
                    "updated_at": _now_iso(),
                },
                "$inc": {"execution_count": 1},
            },
        )

        self._record_audit(
            workspace_id=workspace_id,
            action=f"Recorded execution attempt #{attempt} for test {test_case_id}: {outcome}",
            user=user_name,
            target_id=exec_id,
        )

        if "_id" in doc:
            del doc["_id"]
        return doc

    def get_executions(self, workspace_id: str, test_case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        if test_case_id:
            query["test_case_id"] = test_case_id
        return list(test_executions_collection.find(query, {"_id": 0}).sort("executed_at", -1))

    get_test_executions = get_executions

    # ──────────────────────────────────────────────
    # 7. Defect Management & Retesting
    # ──────────────────────────────────────────────

    def get_defects(
        self,
        workspace_id: str,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        assignment_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        self._ensure_qa_seed_data(workspace_id)
        query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        if status:
            query["status"] = status.upper()
        if severity:
            query["severity"] = severity.upper()
        if assignment_id:
            query["assignment_id"] = assignment_id

        return list(defects_collection.find(query, {"_id": 0}).sort("created_at", -1))

    def create_defect(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        """Creates a defect linked to an execution and requirement."""
        did = f"DEF-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "defect_id": did,
            "workspace_id": workspace_id,
            "title": payload.get("title"),
            "description": payload.get("description"),
            "feature_id": payload.get("feature_id") or "FEAT-PAYMENT-RECOVERY",
            "feature_title": payload.get("feature_title") or "Interactive Payment Failure & Zero-Latency Retry",
            "prd_id": payload.get("prd_id", "PRD-001"),
            "prd_version": payload.get("prd_version", "v1.2"),
            "requirement_id": payload.get("requirement_id") or "REQ-PAYMENT-RECOVERY",
            "criterion_id": payload.get("criterion_id"),
            "test_case_id": payload.get("test_case_id"),
            "execution_id": payload.get("execution_id"),
            "severity": str(payload.get("severity", "HIGH")).upper(),
            "priority": str(payload.get("priority", "P2")).upper(),
            "environment": payload.get("environment", "Staging"),
            "build_reference": payload.get("build_reference"),
            "preconditions": payload.get("preconditions"),
            "steps_to_reproduce": payload.get("steps_to_reproduce", []),
            "expected_result": payload.get("expected_result", ""),
            "actual_result": payload.get("actual_result", ""),
            "reproducibility": payload.get("reproducibility", "ALWAYS"),
            "supporting_evidence": payload.get("supporting_evidence"),
            "reporter": user_name,
            "assigned_developer": payload.get("assigned_developer") or "Satya Prem (Lead Developer)",
            "status": "OPEN",
            "reopen_count": 0,
            "fix_reference": None,
            "fix_notes": None,
            "verification_notes": None,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }

        defects_collection.insert_one(doc)

        # If linked to an execution, annotate execution record
        if doc.get("execution_id"):
            test_executions_collection.update_one(
                {"execution_id": doc["execution_id"]},
                {"$addToSet": {"defect_ids": did}},
            )

        self._record_audit(workspace_id, f"Reported defect {did}: '{doc['title']}' ({doc['severity']}/{doc['priority']})", user_name, did)

        if "_id" in doc:
            del doc["_id"]
        return doc

    def update_defect(self, workspace_id: str, defect_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        defect = defects_collection.find_one({"defect_id": defect_id})
        if not defect:
            raise NotFoundError("Defect", defect_id)

        clean = {k: v for k, v in payload.items() if v is not None}
        if "severity" in clean:
            clean["severity"] = str(clean["severity"]).upper()
        if "priority" in clean:
            clean["priority"] = str(clean["priority"]).upper()
        if "status" in clean:
            clean["status"] = str(clean["status"]).upper()
        clean["updated_at"] = _now_iso()

        defects_collection.update_one({"defect_id": defect_id}, {"$set": clean})
        self._record_audit(workspace_id, f"Updated defect {defect_id} properties", user_name, defect_id)

        return defects_collection.find_one({"defect_id": defect_id}, {"_id": 0})

    def verify_defect(self, workspace_id: str, defect_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        """
        Retest validation workflow:
        - If passed: Defect marked VERIFIED -> CLOSED
        - If failed: Defect marked REOPENED, developer notified
        """
        if "reopen" in payload:
            passed = not bool(payload["reopen"])
        else:
            passed = bool(payload.get("passed", True))
        notes = payload.get("verification_notes", "")
        retest_exec_id = payload.get("retest_execution_id")

        if passed:
            updates = {
                "status": "VERIFIED",
                "verification_notes": notes,
                "verified_at": _now_iso(),
                "verified_by": user_name,
                "updated_at": _now_iso(),
            }
            defects_collection.update_one({"defect_id": defect_id}, {"$set": updates})
            self._record_audit(workspace_id, f"QA Verified fix for defect {defect_id}", user_name, defect_id)
        else:
            updates = {
                "status": "REOPENED",
                "verification_notes": f"Retest failed: {notes}",
                "updated_at": _now_iso(),
            }
            defects_collection.update_one(
                {"defect_id": defect_id},
                {"$set": updates, "$inc": {"reopen_count": 1}},
            )
            self._record_audit(workspace_id, f"QA Reopened defect {defect_id} after failed retest", user_name, defect_id)

        return defects_collection.find_one({"defect_id": defect_id}, {"_id": 0})

    def reopen_defect(self, workspace_id: str, defect_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        defect = defects_collection.find_one({"defect_id": defect_id})
        if not defect:
            raise NotFoundError("Defect", defect_id)

        updates = {
            "status": "REOPENED",
            "verification_notes": f"Reopened: {payload.get('reopen_reason')}",
            "updated_at": _now_iso(),
        }
        if payload.get("new_evidence"):
            updates["supporting_evidence"] = payload.get("new_evidence")

        defects_collection.update_one(
            {"defect_id": defect_id},
            {"$set": updates, "$inc": {"reopen_count": 1}},
        )
        self._record_audit(workspace_id, f"Explicitly reopened defect {defect_id}", user_name, defect_id)
        return defects_collection.find_one({"defect_id": defect_id}, {"_id": 0})

    def get_retesting_queue(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Returns defects eligible for retesting (status in FIX_SUBMITTED or RETEST_PENDING)."""
        self._ensure_qa_seed_data(workspace_id)
        query = {
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "status": {"$in": ["FIX_SUBMITTED", "RETEST_PENDING", "IN_RETEST"]},
        }
        defects = list(defects_collection.find(query, {"_id": 0}).sort("updated_at", -1))
        test_cases = list(test_cases_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}))

        for d in defects:
            tcid = d.get("test_case_id")
            tc = next((t for t in test_cases if t.get("test_case_id") == tcid), None)
            d["original_test_case"] = tc
            d["required_next_action"] = "Execute Verification Retest"

        return defects

    # ──────────────────────────────────────────────
    # 8. Regression Testing
    # ──────────────────────────────────────────────

    def get_regression_tests(self, workspace_id: str) -> Dict[str, Any]:
        """Returns all test cases configured for regression testing and suite execution."""
        self._ensure_qa_seed_data(workspace_id)
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        reg_cases = list(test_cases_collection.find({
            "$and": [
                ws_query,
                {"$or": [{"test_type": "REGRESSION"}, {"priority": "P1"}]}
            ]
        }, {"_id": 0}))

        suites = list(test_suites_collection.find(ws_query, {"_id": 0}))

        total = len(reg_cases)
        passed = sum(1 for tc in reg_cases if tc.get("latest_outcome") == "PASSED")
        failed = sum(1 for tc in reg_cases if tc.get("latest_outcome") == "FAILED")
        untested = sum(1 for tc in reg_cases if tc.get("latest_outcome") in ["NOT_EXECUTED", None])

        return {
            "workspace_id": workspace_id,
            "total_regression_tests": total,
            "passed_count": passed,
            "failed_count": failed,
            "untested_count": untested,
            "pass_rate": round((passed / total) * 100, 1) if total > 0 else 0.0,
            "test_cases": reg_cases,
            "suites": suites,
        }

    # ──────────────────────────────────────────────
    # 9. QA Reports
    # ──────────────────────────────────────────────

    def get_reports(self, workspace_id: str) -> List[Dict[str, Any]]:
        self._ensure_qa_seed_data(workspace_id)
        return list(qa_reports_collection.find({"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}, {"_id": 0}).sort("created_at", -1))

    def get_report_detail(self, workspace_id: str, report_id: str) -> Dict[str, Any]:
        report = qa_reports_collection.find_one({
            "$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}],
            "report_id": report_id,
        }, {"_id": 0})
        if not report:
            raise NotFoundError("QA Report", report_id)
        return report

    def create_report(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead") -> Dict[str, Any]:
        """Generates and persists an authoritative QA Report with server-calculated metrics."""
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}
        test_cases = list(test_cases_collection.find(ws_query, {"_id": 0}))
        defects = list(defects_collection.find(ws_query, {"_id": 0}))

        total_cases = len(test_cases)
        passed = sum(1 for tc in test_cases if tc.get("latest_outcome") == "PASSED")
        failed = sum(1 for tc in test_cases if tc.get("latest_outcome") == "FAILED")
        blocked = sum(1 for tc in test_cases if tc.get("latest_outcome") == "BLOCKED")
        skipped = sum(1 for tc in test_cases if tc.get("latest_outcome") == "SKIPPED")
        unexecuted = sum(1 for tc in test_cases if tc.get("latest_outcome") in ["NOT_EXECUTED", None])

        pass_rate = round((passed / total_cases) * 100, 1) if total_cases > 0 else 0.0

        open_crit = sum(1 for d in defects if d.get("severity") == "CRITICAL" and d.get("status") not in ["VERIFIED", "CLOSED"])
        open_high = sum(1 for d in defects if d.get("severity") == "HIGH" and d.get("status") not in ["VERIFIED", "CLOSED"])
        open_med = sum(1 for d in defects if d.get("severity") == "MEDIUM" and d.get("status") not in ["VERIFIED", "CLOSED"])
        open_low = sum(1 for d in defects if d.get("severity") == "LOW" and d.get("status") not in ["VERIFIED", "CLOSED"])

        awaiting_retest = sum(1 for d in defects if d.get("status") in ["FIX_SUBMITTED", "RETEST_PENDING"])
        verified = sum(1 for d in defects if d.get("status") in ["VERIFIED", "CLOSED"])

        metrics = {
            "total_test_cases": total_cases,
            "executed_test_cases": total_cases - unexecuted,
            "passed_tests": passed,
            "failed_tests": failed,
            "blocked_tests": blocked,
            "skipped_tests": skipped,
            "unexecuted_tests": unexecuted,
            "pass_rate": pass_rate,
            "open_defects_by_severity": {
                "CRITICAL": open_crit,
                "HIGH": open_high,
                "MEDIUM": open_med,
                "LOW": open_low,
            },
        }
        report_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "report_id": report_id,
            "workspace_id": workspace_id,
            "title": payload.get("title") or payload.get("report_title") or f"Sprint QA Report - {_now_iso()[:10]}",
            "feature_id": payload.get("feature_id") or "FEAT-PAYMENT-RECOVERY",
            "prd_id": payload.get("prd_id", "PRD-001"),
            "prd_version": payload.get("prd_version", "v1.2"),
            "test_plan_id": payload.get("test_plan_id"),
            "period_start": payload.get("period_start", _now_iso()[:10]),
            "period_end": payload.get("period_end", _now_iso()[:10]),
            "metrics": metrics,
            "metrics_snapshot": metrics,
            "retesting_status": {
                "awaiting_retest": awaiting_retest,
                "verified_fixes": verified,
            },
            "requirement_coverage_pct": round(((total_cases - unexecuted) / total_cases) * 100, 1) if total_cases > 0 else 0.0,
            "known_limitations": payload.get("known_limitations", "None noted during staging window."),
            "outstanding_risks": payload.get("outstanding_risks", "Critical defect DEF-01 requires verification after deployment."),
            "qa_recommendation": payload.get("qa_recommendation", ("QA_PASSED" if open_crit == 0 and failed == 0 else "QA_FAILED")),
            "author": user_name,
            "created_at": _now_iso(),
        }

        qa_reports_collection.insert_one(doc)
        self._record_audit(workspace_id, f"Submitted official QA Report {report_id} with recommendation {doc['qa_recommendation']}", user_name, report_id)

        if "_id" in doc:
            del doc["_id"]
        return doc

    create_qa_report = create_report

    # ──────────────────────────────────────────────
    # 10. Release Readiness Gating
    # ──────────────────────────────────────────────

    def get_release_readiness(self, workspace_id: str) -> Dict[str, Any]:
        """Calculates release readiness scorecard against required quality gates."""
        self._ensure_qa_seed_data(workspace_id)
        ws_query = {"$or": [{"workspace_id": workspace_id}, {"workspaceId": workspace_id}]}

        test_cases = list(test_cases_collection.find(ws_query, {"_id": 0}))
        defects = list(defects_collection.find(ws_query, {"_id": 0}))

        total = len(test_cases)
        passed = sum(1 for tc in test_cases if tc.get("latest_outcome") == "PASSED")
        failed = sum(1 for tc in test_cases if tc.get("latest_outcome") == "FAILED")
        blocked = sum(1 for tc in test_cases if tc.get("latest_outcome") == "BLOCKED")
        unexecuted = sum(1 for tc in test_cases if tc.get("latest_outcome") in ["NOT_EXECUTED", None])

        coverage = round(((total - unexecuted) / total) * 100, 1) if total > 0 else 0.0

        crit_defects = [d for d in defects if d.get("severity") == "CRITICAL" and d.get("status") not in ["VERIFIED", "CLOSED"]]
        high_defects = [d for d in defects if d.get("severity") == "HIGH" and d.get("status") not in ["VERIFIED", "CLOSED"]]

        missing_criteria = []
        if len(crit_defects) > 0:
            missing_criteria.append(f"{len(crit_defects)} Critical defect(s) unresolved (DEF-01 collision)")
        if failed > 0:
            missing_criteria.append(f"{failed} test case(s) failing on staging")
        if unexecuted > 0:
            missing_criteria.append(f"{unexecuted} test case(s) awaiting execution")

        ready = (len(crit_defects) == 0 and failed == 0 and unexecuted == 0 and blocked == 0)
        recommendation = "QA_PASSED" if ready else ("BLOCKED" if len(crit_defects) > 0 else "TESTING_IN_PROGRESS")

        return {
            "workspace_id": workspace_id,
            "feature_scope": "Interactive Payment Failure & Zero-Latency Retry",
            "prd_version": "v1.2",
            "total_tests": total,
            "execution_coverage_pct": coverage,
            "latest_passed": passed,
            "latest_failed": failed,
            "open_critical_defects": len(crit_defects),
            "open_high_defects": len(high_defects),
            "blocked_tests": blocked,
            "unexecuted_required_tests": unexecuted,
            "outstanding_approvals": ["PM Final Release Sign-off", "Security Compliance Audit"],
            "known_risks": [
                "Transient network spike may trigger secondary retry queue latency.",
                "Redis failover cluster has not undergone soak testing under > 10k QPS.",
            ],
            "qa_recommendation": recommendation,
            "ready_for_release": ready,
            "is_release_ready": ready,
            "release_verdict": "APPROVED" if ready else "BLOCKED",
            "readiness_score": 100 if ready else 60,
            "checklist": missing_criteria or ["All critical paths verified", "No high priority bugs open"],
            "blockers": [f"Open critical defects: {len(crit_defects)}"] if crit_defects else [],
            "missing_criteria": missing_criteria,
        }

    # ──────────────────────────────────────────────
    # 11. Clarification & Audit Helpers
    # ──────────────────────────────────────────────

    def create_clarification(self, workspace_id: str, payload: Dict[str, Any], user_name: str = "QA Lead", user_id: str = "") -> Dict[str, Any]:
        clar_id = f"CLR-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "clarification_id": clar_id,
            "workspace_id": workspace_id,
            "assignment_id": payload.get("assignment_id"),
            "requirement_id": payload.get("requirement_id") or "REQ-PAYMENT-RECOVERY",
            "subject": payload.get("subject"),
            "question": payload.get("question"),
            "suggested_resolution": payload.get("suggested_resolution"),
            "urgency": payload.get("urgency", "MEDIUM"),
            "reason_for_ambiguity": payload.get("reason_for_ambiguity"),
            "expected_decision": payload.get("expected_decision"),
            "status": "PENDING_PM_RESPONSE",
            "response": None,
            "created_by": user_name,
            "created_at": _now_iso(),
        }
        clarification_requests_collection.insert_one(doc)
        self._record_audit(workspace_id, f"Submitted requirement clarification to PM for {doc['requirement_id']}", user_name, clar_id)
        if "_id" in doc:
            del doc["_id"]
        return doc

    request_pm_clarification = create_clarification

    def _record_audit(self, workspace_id: str, action: str, user: str, target_id: str = "") -> None:
        try:
            qa_audit_collection.insert_one({
                "workspace_id": workspace_id,
                "action": action,
                "user": user,
                "target_id": target_id,
                "timestamp": _now_iso(),
            })
        except Exception:
            pass


qa_service = QAService()
