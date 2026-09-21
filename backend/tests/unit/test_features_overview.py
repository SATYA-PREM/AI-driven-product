"""
test_features_overview.py
-------------------------
Unit tests for the Feature Lifecycle Management and Feature Overview Service.
"""

import pytest
from app.services.intelligence.feature_service import feature_service
from app.repositories.feature_repository import feature_repository


def test_ensure_and_list_features():
    ws_id = "test-ws-features-001"
    
    # Ensure features seeds baseline
    seeded = feature_service.ensure_features(workspace_id=ws_id)
    assert len(seeded) >= 10
    assert any(f["name"] == "One-click checkout" for f in seeded)

    # List features
    res = feature_service.list_features(workspace_id=ws_id)
    assert "features" in res
    assert "metrics" in res
    assert res["total_count"] >= 10

    metrics = res["metrics"]
    assert metrics["total_features"] >= 10
    assert metrics["unique_users_impacted"] > 0
    assert len(metrics["status_distribution"]) > 0
    assert len(metrics["priority_distribution"]) > 0


def test_create_and_update_feature():
    ws_id = "test-ws-features-002"

    # Create new feature
    created = feature_service.create_feature(
        workspace_id=ws_id,
        data={
            "name": "Fast Reorder Button",
            "desc": "Reorder previous purchase with one click",
            "category": "Checkout & Payments",
            "priority": "High",
            "status": "Planned",
            "users_impacted": 1200,
            "feedback_count": 45,
            "source": "In-App Feedback",
        },
    )
    assert created["name"] == "Fast Reorder Button"
    assert created["status"] == "Planned"
    feat_id = created["feature_id"]

    # Update feature status to In Progress
    updated = feature_service.update_feature(
        feature_id=feat_id,
        workspace_id=ws_id,
        update_data={"status": "In Progress", "priority": "Critical"},
    )
    assert updated is not None
    assert updated["status"] == "In Progress"
    assert updated["priority"] == "Critical"

    # Send to prioritization
    p_res = feature_service.send_to_prioritization(feature_id=feat_id, workspace_id=ws_id)
    assert p_res["roadmap_status"] == "In Prioritization Review"
    assert p_res["prioritization_score"] == 85.0

    # Link to PRD
    prd_res = feature_service.link_prd(feature_id=feat_id, workspace_id=ws_id)
    assert prd_res["prd_linked"] is True
    assert prd_res["prd_id"] is not None

    # Add to roadmap
    r_res = feature_service.add_to_roadmap(feature_id=feat_id, workspace_id=ws_id)
    assert r_res["roadmap_status"] == "Scheduled in Roadmap (Sprint 25)"


def test_extract_features_from_feedback():
    ws_id = "test-ws-features-003"
    extracted = feature_service.extract_features_from_feedback(workspace_id=ws_id)
    assert isinstance(extracted, list)

