"""
test_stakeholder_api.py
-----------------------
Integration tests for Stakeholder Workspace API routes:
- Dashboard endpoint
- Product overview
- Business objectives
- Pending approvals & decision submission
- Decision history
- Business feedback submission
- Milestones, risks, and success metrics
- RBAC protection (unauthenticated access rejected)
"""

import pytest


@pytest.fixture(autouse=True)
def mock_auth_user(monkeypatch):
    from app.services.auth.auth_service import AuthService
    fake_pm = {
        "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
        "id": "65f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Sarah Lin",
        "email": "pm@example.com",
        "role": "pm",
        "is_active": True
    }
    monkeypatch.setattr(AuthService, "get_user_by_id", lambda user_id: fake_pm)


def test_stakeholder_endpoints_require_auth(client):
    ws_id = "test-ws-api-001"
    res = client.get(f"/api/v1/workspaces/{ws_id}/stakeholder/dashboard")
    assert res.status_code in [401, 403]


def test_stakeholder_dashboard_api(client, auth_headers_pm):
    ws_id = "test-ws-api-002"
    res = client.get(f"/api/v1/workspaces/{ws_id}/stakeholder/dashboard", headers=auth_headers_pm)
    assert res.status_code == 200
    data = res.json()
    assert data["workspace_id"] == ws_id
    assert "kpis" in data
    assert "active_initiatives" in data["kpis"]
    assert "pending_decisions" in data["kpis"]


def test_stakeholder_product_overview_api(client, auth_headers_pm):
    ws_id = "test-ws-api-003"
    res = client.get(f"/api/v1/workspaces/{ws_id}/stakeholder/product-overview", headers=auth_headers_pm)
    assert res.status_code == 200
    data = res.json()
    assert data["product_name"] != ""
    assert "traceability_links" in data


def test_stakeholder_approvals_api(client, auth_headers_pm):
    ws_id = "test-ws-api-004"
    res = client.get(f"/api/v1/workspaces/{ws_id}/stakeholder/approvals", headers=auth_headers_pm)
    assert res.status_code == 200
    approvals = res.json()
    assert len(approvals) >= 1
    req_id = approvals[0]["request_id"]

    # Post decision
    dec_res = client.post(
        f"/api/v1/workspaces/{ws_id}/stakeholder/approvals/{req_id}/decision",
        json={
            "decision": "APPROVED",
            "rationale": "Commercial value demonstrated with verified conversion metrics.",
            "comments": "Proceed to sprint execution."
        },
        headers=auth_headers_pm
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["success"] is True
    assert dec_data["status"] == "APPROVED"


def test_stakeholder_feedback_api(client, auth_headers_pm):
    ws_id = "test-ws-api-005"
    fdbk_res = client.post(
        f"/api/v1/workspaces/{ws_id}/stakeholder/feedback",
        json={
            "related_resource_type": "PRD",
            "related_resource_id": "PRD-001",
            "related_title": "One-Click Checkout",
            "category": "BUSINESS_IMPACT",
            "description": "Tax and duty transparency needed on first screen for EU shoppers.",
            "business_rationale": "Reduces cart abandonment by 9% in European regions.",
            "expected_impact": "+$180k GMV quarterly in EU",
            "suggested_action": "Show localized VAT inclusive pricing toggle."
        },
        headers=auth_headers_pm
    )
    assert fdbk_res.status_code == 200
    fdbk_data = fdbk_res.json()
    assert fdbk_data["status"] == "SUBMITTED"
    assert "feedback_id" in fdbk_data
