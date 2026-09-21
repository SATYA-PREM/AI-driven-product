"""
Unit tests for Feedback Management service and repository.
"""
import pytest
from app.services.intelligence.feedback_service import FeedbackService
from app.schemas.feedback import (
    FeedbackCreateRequest,
    FeedbackUpdateRequest,
    FeedbackMapFeatureRequest,
)


@pytest.fixture
def feedback_service():
    return FeedbackService()


def test_list_feedback_and_metrics(feedback_service):
    workspace_id = "test-fb-workspace-001"
    res = feedback_service.list_feedback(workspace_id=workspace_id)
    assert res is not None
    assert len(res.feedback) > 0
    assert res.total > 0

    metrics = res.metrics
    assert metrics.total_feedback >= len(res.feedback)
    assert metrics.positive_count >= 0
    assert metrics.negative_count >= 0
    assert len(metrics.trend) > 0
    assert len(metrics.source_distribution) > 0
    assert len(metrics.top_themes) > 0


def test_create_and_update_feedback(feedback_service):
    workspace_id = "test-fb-workspace-002"
    req = FeedbackCreateRequest(
        text="The search function returns zero results when typing brand names.",
        source="Support",
        sentiment="Negative",
        category="Product Discovery",
        priority="High",
        status="New",
        user_id="user_test_99",
        device="iOS",
        app_version="v2.3.1",
    )
    created = feedback_service.create_feedback(workspace_id, req)
    assert created.feedback_id.startswith("FB-")
    assert created.text == req.text
    assert created.status == "New"
    assert created.priority == "High"
    assert created.sentiment == "Negative"

    # Update to Resolved
    update_req = FeedbackUpdateRequest(status="Resolved")
    updated = feedback_service.update_feedback(workspace_id, created.feedback_id, update_req)
    assert updated is not None
    assert updated.status == "Resolved"
    assert updated.resolution_date is not None


def test_map_feature_to_feedback(feedback_service):
    workspace_id = "test-fb-workspace-003"
    feedback_service.seed_initial_feedback_if_empty(workspace_id)
    first_item = feedback_service.list_feedback(workspace_id).feedback[0]

    map_req = FeedbackMapFeatureRequest(
        feature_name="Dynamic Faceted Search Engine",
    )
    mapped = feedback_service.map_feature(workspace_id, first_item.feedback_id, map_req)
    assert mapped is not None
    assert mapped.mapped_feature_name == "Dynamic Faceted Search Engine"
    assert mapped.mapped_feature_id is not None
    assert mapped.status == "In Review"

