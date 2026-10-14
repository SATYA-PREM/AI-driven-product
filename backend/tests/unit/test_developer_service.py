"""
Unit tests for Developer Service:
- Dashboard KPI calculation and assignment retrieval
- State transitions (PENDING -> IN_PROGRESS -> IN_REVIEW)
- Implementation submissions with auto-incrementing revisions
- Defect tracking and fix submissions
- Blocker and clarification request logging
- Design handoff aggregation
"""

import pytest
from app.services.developer_service import developer_service
from app.core.constants import ProductTeamRole


def test_developer_dashboard_and_seed():
    ws_id = "ws_dev_test_01"
    dash = developer_service.get_dashboard(workspace_id=ws_id, user_id="test_dev_01", email="dev@prodai.app")

    assert dash is not None
    assert "kpis" in dash
    assert dash["kpis"]["total_assigned"] >= 0
    assert "recent_tasks" in dash
    assert "open_defects" in dash
    assert "approved_handoffs" in dash


def test_developer_assignments_list_and_status_update():
    ws_id = "ws_dev_test_02"
    assignments = developer_service.get_assignments(workspace_id=ws_id, user_id="test_dev_02", email="dev@prodai.app")
    assert len(assignments) > 0

    first_asn = assignments[0]
    asn_id = first_asn["assignment_id"]

    # Start task
    updated = developer_service.update_assignment_status(
        workspace_id=ws_id,
        assignment_id=asn_id,
        new_status="IN_PROGRESS",
        user_name="Developer Alex",
        notes="Started work on branch",
    )
    assert updated["status"] == "IN_PROGRESS"

    # Detail check
    detail = developer_service.get_assignment_detail(workspace_id=ws_id, assignment_id=asn_id)
    assert detail["assignment"]["status"] == "IN_PROGRESS"


def test_implementation_submission_revisions():
    ws_id = "ws_dev_test_03"
    assignments = developer_service.get_assignments(workspace_id=ws_id, user_id="test_dev_03", email="dev@prodai.app")
    target_asn = assignments[0]
    asn_id = target_asn["assignment_id"]

    # Revision 1
    sub1 = developer_service.submit_implementation(
        workspace_id=ws_id,
        payload={
            "assignment_id": asn_id,
            "requirement_id": target_asn.get("requirement_id", "REQ-01"),
            "prd_id": target_asn.get("prd_id", "PRD-01"),
            "branch_name": "feature/payment-webhook",
            "pr_url": "https://github.com/org/repo/pull/1",
            "implementation_notes": "Implemented webhook listener with HMAC signature verification.",
            "test_notes": "Passes 12 unit tests",
            "flag_for_qa_retest": True,
        },
        user_name="Developer Alex",
    )
    assert sub1["revision_number"] >= 1
    assert sub1["status"] == "IN_REVIEW"

    # Revision 2
    sub2 = developer_service.submit_implementation(
        workspace_id=ws_id,
        payload={
            "assignment_id": asn_id,
            "requirement_id": target_asn.get("requirement_id", "REQ-01"),
            "prd_id": target_asn.get("prd_id", "PRD-01"),
            "branch_name": "feature/payment-webhook",
            "pr_url": "https://github.com/org/repo/pull/1",
            "commit_sha": "a1b2c3d",
            "implementation_notes": "Updated idempotency expiry to 24 hours.",
            "flag_for_qa_retest": True,
        },
        user_name="Developer Alex",
    )
    assert sub2["revision_number"] == sub1["revision_number"] + 1


def test_defects_and_fix_workflow():
    ws_id = "ws_dev_test_04"
    # Ensure seed
    developer_service._ensure_developer_seed_data(ws_id)
    defects = developer_service.get_defects(workspace_id=ws_id)
    assert len(defects) > 0

    target_def = defects[0]
    def_id = target_def["defect_id"]

    fix = developer_service.submit_defect_fix(
        workspace_id=ws_id,
        defect_id=def_id,
        payload={
            "fix_summary": "Added distributed lock in Redis to prevent race condition during retry clicks.",
            "pr_url": "https://github.com/org/repo/pull/2",
            "commit_sha": "99f8e7d",
            "retest_instructions": "Simulate 5 rapid POST /checkout requests with same idempotency key.",
        },
        user_name="Developer Alex",
    )
    assert fix["status"] == "IN_RETEST"
    assert fix["fix_summary"] is not None


def test_blocker_and_clarification():
    ws_id = "ws_dev_test_05"
    assignments = developer_service.get_assignments(workspace_id=ws_id, user_id="test_dev_05", email="dev@prodai.app")
    asn_id = assignments[0]["assignment_id"]

    # Blocker
    blocker = developer_service.create_blocker(
        workspace_id=ws_id,
        payload={
            "assignment_id": asn_id,
            "blocker_summary": "Payment gateway sandbox API credentials return 401 Unauthorized.",
            "impact_level": "CRITICAL",
            "category": "THIRD_PARTY_SERVICE",
        },
        user_name="Developer Alex",
    )
    assert blocker["blocker_id"] is not None
    assert blocker["task_status"] == "BLOCKED"

    # Clarification
    clar = developer_service.create_clarification(
        workspace_id=ws_id,
        payload={
            "assignment_id": asn_id,
            "subject": "Grace period for expired session",
            "question": "Should users receive an error modal or redirect to pricing upon session expiration?",
            "urgency": "HIGH",
        },
        user_name="Developer Alex",
    )
    assert clar["clarification_id"] is not None

