"""
test_stakeholder_service.py
---------------------------
Unit tests for the Business Owner / Stakeholder Workspace:
- Executive dashboard KPI calculations & safe metric states
- Business objectives retrieval
- Roadmap & initiative portfolio
- Approval request review, decision recording, and duplicate decision prevention
- Immutable decision audit history
- Structured business feedback & PM response workflow
- Milestones and progress percentages
- Business risks and dependencies
- Stakeholder notification tracking
"""

import pytest
from app.services.stakeholder_service import stakeholder_service
from app.core.exceptions import ValidationError, NotFoundError
from app.core.database import (
    approval_requests_collection,
    decision_records_collection,
    stakeholder_feedback_collection,
    business_objectives_collection,
    milestones_collection,
    business_metrics_collection,
    business_risks_collection,
)


def test_stakeholder_dashboard_and_kpis():
    ws_id = "test-ws-stakeholder-001"
    res = stakeholder_service.get_dashboard(workspace_id=ws_id, user_email="stakeholder@example.com")
    
    assert res["workspace_id"] == ws_id
    assert "kpis" in res
    kpis = res["kpis"]
    assert "active_initiatives" in kpis
    assert "pending_decisions" in kpis
    assert "upcoming_milestones" in kpis
    assert "open_risks" in kpis
    assert "business_impact" in kpis
    
    assert kpis["active_initiatives"]["value"] >= 1
    assert kpis["pending_decisions"]["value"] >= 1
    assert len(res["recent_initiatives"]) >= 1
    assert len(res["pending_approvals"]) >= 1
    assert len(res["critical_risks"]) >= 1


def test_product_overview_traceability():
    ws_id = "test-ws-stakeholder-002"
    overview = stakeholder_service.get_product_overview(workspace_id=ws_id)
    
    assert overview["workspace_id"] == ws_id
    assert overview["product_name"] != ""
    assert len(overview["strategic_objectives"]) >= 1
    assert len(overview["customer_problems"]) >= 1
    assert "traceability_links" in overview
    links = overview["traceability_links"]
    assert "active_objectives_count" in links
    assert "tracked_metrics_count" in links


def test_business_objectives_listing():
    ws_id = "test-ws-stakeholder-003"
    objs = stakeholder_service.list_business_objectives(workspace_id=ws_id)
    assert len(objs) >= 2
    first = objs[0]
    assert "objective_id" in first
    assert "business_rationale" in first
    assert "how_success_measured" in first

    detail = stakeholder_service.get_objective_detail(workspace_id=ws_id, objective_id=first["objective_id"])
    assert detail["title"] == first["title"]


def test_pending_approvals_and_decision_lifecycle():
    ws_id = "test-ws-stakeholder-004"
    approvals = stakeholder_service.list_approval_requests(workspace_id=ws_id, status="PENDING")
    assert len(approvals) >= 1
    target_req = approvals[0]
    req_id = target_req["request_id"]

    # Test rejection with short rationale fails validation
    with pytest.raises(ValidationError):
        stakeholder_service.submit_decision(
            workspace_id=ws_id,
            request_id=req_id,
            decision_data={"decision": "REJECTED", "rationale": "Short"},
            user_email="boss@example.com",
            user_name="Sarah Lin",
        )

    # Test valid approval decision
    result = stakeholder_service.submit_decision(
        workspace_id=ws_id,
        request_id=req_id,
        decision_data={
            "decision": "APPROVED",
            "rationale": "Business alignment verified with strong conversion upside and manageable compliance risks.",
            "comments": "Ensure secondary fallback gateway contract is signed before launch.",
            "follow_up_actions": ["Notify lead architect", "Schedule final penetration test review"]
        },
        user_email="boss@example.com",
        user_name="Sarah Lin",
    )
    assert result["success"] is True
    assert result["status"] == "APPROVED"
    assert "decision_id" in result

    # Check updated status
    updated_req = stakeholder_service.get_approval_request_detail(workspace_id=ws_id, request_id=req_id)
    assert updated_req["status"] == "APPROVED"
    assert updated_req["resolved_decision"]["decision"] == "APPROVED"

    # Conflicting decision on finalized item is rejected
    with pytest.raises(ValidationError):
        stakeholder_service.submit_decision(
            workspace_id=ws_id,
            request_id=req_id,
            decision_data={"decision": "REJECTED", "rationale": "Attempting conflicting reversal without authorized flow."},
            user_email="boss@example.com",
            user_name="Sarah Lin",
        )

    # Verify decision history audit record
    history = stakeholder_service.list_decision_history(workspace_id=ws_id)
    assert any(h["request_id"] == req_id and h["decision"] == "APPROVED" for h in history)


def test_structured_feedback_workflow():
    ws_id = "test-ws-stakeholder-005"
    
    # Submit feedback
    fdbk = stakeholder_service.submit_business_feedback(
        workspace_id=ws_id,
        feedback_data={
            "related_resource_type": "PRD",
            "related_resource_id": "PRD-001",
            "related_title": "One-Click Checkout PRD",
            "category": "BUSINESS_IMPACT",
            "description": "Please ensure localized tax calculations are cached on edge servers to prevent latency spikes in Europe.",
            "business_rationale": "European holiday sales account for 28% of Q4 GMV.",
            "expected_impact": "Maintains <1.2s p95 latency for international transactions.",
            "suggested_action": "Add Cloudflare Workers or Edge Cache layer to Tax Service integration."
        },
        user_email="director@example.com",
        user_name="Marcus Vance",
    )
    assert fdbk["status"] == "SUBMITTED"
    assert "feedback_id" in fdbk
    feedback_id = fdbk["feedback_id"]

    # PM responds to feedback
    resp = stakeholder_service.respond_to_feedback(
        workspace_id=ws_id,
        feedback_id=feedback_id,
        response_text="Edge tax caching has been incorporated into Section 4.3 of the technical spec.",
        status="ACCEPTED",
        pm_name="Priya Sharma",
    )
    assert resp["success"] is True

    # Check feedback history
    all_fdbk = stakeholder_service.list_business_feedback(workspace_id=ws_id)
    target = next((f for f in all_fdbk if f["feedback_id"] == feedback_id), None)
    assert target is not None
    assert target["status"] == "ACCEPTED"
    assert "Priya Sharma" in target["pm_response_by"]


def test_milestones_and_risks():
    ws_id = "test-ws-stakeholder-006"
    milestones = stakeholder_service.list_milestones(workspace_id=ws_id)
    assert len(milestones) >= 2
    for m in milestones:
        assert "milestone_id" in m
        assert "target_date" in m
        assert m["status"] in ["PLANNED", "IN_PROGRESS", "AT_RISK", "BLOCKED", "COMPLETED", "CANCELLED"]

    risks_data = stakeholder_service.list_risks_and_dependencies(workspace_id=ws_id)
    assert "risks" in risks_data
    assert "dependencies" in risks_data
    assert len(risks_data["risks"]) >= 1
    assert len(risks_data["dependencies"]) >= 1


def test_business_metrics_presentation():
    ws_id = "test-ws-stakeholder-007"
    metrics = stakeholder_service.list_business_metrics(workspace_id=ws_id)
    assert len(metrics) >= 2
    configured = [m for m in metrics if m["is_configured"]]
    unconfigured = [m for m in metrics if not m["is_configured"]]
    
    assert len(configured) >= 1
    assert len(unconfigured) >= 1
    assert unconfigured[0]["current_value"] == "Not configured"

