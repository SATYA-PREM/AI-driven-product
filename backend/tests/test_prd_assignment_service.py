"""
Unit tests for PRD Assignment Service and API.
"""

import pytest
from app.services.prd_assignment_service import prd_assignment_service
from app.core.constants import ProductTeamRole, AssignmentStatus, AssignmentMethod


def test_get_workspace_team_members():
    members = prd_assignment_service.get_workspace_team_members("ws_test_123")
    assert len(members) >= 5
    roles = [m["team_role"] for m in members]
    assert ProductTeamRole.PRODUCT_MANAGER.value in roles
    assert ProductTeamRole.PRODUCT_DESIGNER.value in roles
    assert ProductTeamRole.DEVELOPER.value in roles
    assert ProductTeamRole.QA.value in roles
    assert ProductTeamRole.STAKEHOLDER.value in roles


def test_create_manual_assignment_and_history():
    ws_id = "ws_test_assignment"
    prd_id = "PRD-TEST-999"
    req_id = "REQ-001"

    assignments = [
        {"user_id": "usr_dev_1", "team_role": "DEVELOPER", "reason": "Backend implementation"},
        {"user_id": "usr_qa_1", "team_role": "QA", "reason": "SLA testing"},
    ]

    created = prd_assignment_service.create_manual_assignment(
        workspace_id=ws_id,
        prd_id=prd_id,
        requirement_id=req_id,
        assignments=assignments,
        assigned_by="Priya Sharma (PM)",
    )

    assert len(created) == 2
    assert created[0]["assignment_method"] == AssignmentMethod.MANUAL.value
    assert created[0]["status"] == AssignmentStatus.ASSIGNED.value

    # Verify history logged
    history = prd_assignment_service.get_history(requirement_id=req_id, prd_id=prd_id)
    assert len(history) >= 2


def test_reassign_and_summary():
    ws_id = "ws_test_summary"
    prd_id = "PRD-TEST-SUM"
    req_id = "REQ-SUM-1"

    created = prd_assignment_service.create_manual_assignment(
        workspace_id=ws_id,
        prd_id=prd_id,
        requirement_id=req_id,
        assignments=[{"user_id": "usr_old", "team_role": "DEVELOPER"}],
        assigned_by="PM",
    )
    asn_id = created[0]["assignment_id"]

    updated = prd_assignment_service.reassign(
        assignment_id=asn_id,
        new_user_id="usr_new",
        team_role="DEVELOPER",
        reassigned_by="PM Lead",
        reason="Workload rebalance",
    )
    assert updated is not None
    assert updated["user_id"] == "usr_new"

    # Test removal
    removed = prd_assignment_service.remove_assignment(asn_id, removed_by="PM Lead")
    assert removed is True

