"""
Unit tests for the PRD Assignment Agent (Product Team Assignment Specialist).
"""

import pytest
from app.agents.prd_assignment_agent.agent import PRDAssignmentAgent
from app.agents.prd_assignment_agent.tools import (
    extract_lean_planning_context,
    validate_and_sanitize_recommendations,
    deterministic_assignment_fallback,
)
from app.core.constants import ProductTeamRole


@pytest.fixture
def mock_candidates():
    return [
        {"user_id": "usr_pm", "name": "Priya Sharma (PM)", "team_role": "PRODUCT_MANAGER"},
        {"user_id": "usr_designer", "name": "Yash (Designer)", "team_role": "PRODUCT_DESIGNER"},
        {"user_id": "usr_dev", "name": "Elamaran (Engineer)", "team_role": "DEVELOPER"},
        {"user_id": "usr_qa", "name": "Ananya (QA)", "team_role": "QA"},
        {"user_id": "usr_stakeholder", "name": "Marcus (Stakeholder)", "team_role": "STAKEHOLDER"},
    ]


@pytest.fixture
def mock_prd_data():
    project = {
        "prd_id": "PRD-TEST-001",
        "title": "Payment Flow & UX Remediation",
        "category": "Payment Experience",
    }
    doc = {
        "title": "Payment Flow & UX Remediation",
        "executive_summary": "Redesign checkout UX and implement backend payment retry services.",
    }
    reqs = [
        {
            "requirement_id": "REQ-001",
            "feature_id": "FEAT-001",
            "title": "Responsive Checkout Modal & Card Input UX",
            "description": "Create intuitive UI layout for credit card and UPI input with interaction animations.",
            "type": "UI_UX",
        },
        {
            "requirement_id": "REQ-002",
            "feature_id": "FEAT-001",
            "title": "Payment Gateway Webhook & Idempotency API",
            "description": "Implement idempotent backend endpoint with retry logic and telemetry logging.",
            "type": "BACKEND",
        },
        {
            "requirement_id": "REQ-003",
            "feature_id": "FEAT-001",
            "title": "End-to-End SLA Validation & Failure Testing",
            "description": "Perform edge-case testing for network timeouts and verify SLA criteria.",
            "type": "QA_TESTING",
        },
    ]
    features = [{"feature_id": "FEAT-001", "name": "Checkout Remediation"}]
    criteria = [{"requirement_id": "REQ-001", "criterion": "Input validates Luhn algorithm"}]
    return project, doc, reqs, features, criteria


def test_extract_lean_planning_context(mock_prd_data):
    project, doc, reqs, features, criteria = mock_prd_data
    context = extract_lean_planning_context(project, doc, reqs, features, criteria)
    assert context["prd_id"] == "PRD-TEST-001"
    assert len(context["requirements"]) == 3
    assert context["requirements"][0]["requirement_id"] == "REQ-001"


def test_validate_and_sanitize_recommendations(mock_candidates, mock_prd_data):
    project, doc, reqs, features, criteria = mock_prd_data
    raw_recs = [
        {
            "requirement_id": "REQ-001",
            "recommended_members": [
                {
                    "user_id": "usr_designer",
                    "role": "PRODUCT_DESIGNER",
                    "reason": "UI layout task",
                    "confidence": 0.94,
                }
            ],
        },
        {
            "requirement_id": "REQ-002",
            "recommended_members": [
                {
                    "user_id": "usr_dev",
                    "role": "DEVELOPER",
                    "reason": "API endpoint work",
                    "confidence": 0.89,
                }
            ],
        },
    ]
    sanitized = validate_and_sanitize_recommendations(raw_recs, mock_candidates, reqs, "PRD-TEST-001")
    assert len(sanitized) == 2
    assert sanitized[0]["recommended_members"][0]["user_id"] == "usr_designer"
    assert sanitized[1]["recommended_members"][0]["user_id"] == "usr_dev"


def test_deterministic_assignment_fallback(mock_candidates, mock_prd_data):
    project, doc, reqs, features, criteria = mock_prd_data
    recs = deterministic_assignment_fallback(project, reqs, mock_candidates)
    assert len(recs) == 3
    req1_roles = [m["role"] for m in recs[0]["recommended_members"]]
    assert "PRODUCT_DESIGNER" in req1_roles

