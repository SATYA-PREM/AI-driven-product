"""
Unit tests for PM Review & Decision Gate functionality.
Tests review lifecycle: PENDING_REVIEW -> ACCEPTED / REJECTED / REANALYSIS_REQUESTED,
persistence, and evidence retrieval.
"""

from app.models.intelligence import ProductInsightModel
from app.repositories.intelligence_repository import intelligence_repository
from app.services.intelligence.intelligence_service import intelligence_service


def test_product_insight_model_pm_review_defaults():
    doc = ProductInsightModel.create_document(
        workspace_id="ws-test-1",
        dataset_id="ds-test-1",
        insight_id="PI-TEST-001",
        insight_type="HIGH_PRIORITY_ISSUE",
        title="Payment Gateway Timeout",
        summary="Customers face timeouts during checkout.",
        product_area="checkout_billing",
        frequency=15,
        percentage_of_feedback=25.0,
        dominant_sentiment="negative",
        severity="high",
        priority_score=82.5,
        priority_level="high",
        evidence_record_ids=["FB-001", "FB-002"],
    )

    assert doc["review_status"] == "PENDING_REVIEW"
    assert doc["pm_comment"] is None
    assert doc["reviewed_at"] is None
    assert doc["reviewed_by"] is None
    assert "FB-001" in doc["evidence_record_ids"]


def test_insight_review_lifecycle_updates():
    workspace_id = "ws-review-test"
    dataset_id = "ds-review-test"
    insight_id = "PI-REVIEW-001"

    # Save initial insight
    doc = ProductInsightModel.create_document(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        insight_id=insight_id,
        insight_type="EMERGING_ISSUE",
        title="Search latency spikes",
        summary="Search results take 4s to load.",
        product_area="search",
        frequency=8,
        percentage_of_feedback=12.0,
        dominant_sentiment="negative",
        severity="medium",
        priority_score=70.0,
        priority_level="medium",
        evidence_record_ids=["FB-010"],
    )
    intelligence_repository.save_product_insight(doc)

    # 1. Update review to ACCEPTED
    updated = intelligence_service.update_insight_review(
        workspace_id=workspace_id,
        insight_id=insight_id,
        review_status="ACCEPTED",
        pm_comment="Approved for Q3 roadmap execution",
        reviewed_by="pm@example.com",
    )

    assert updated["review_status"] == "ACCEPTED"
    assert updated["pm_comment"] == "Approved for Q3 roadmap execution"
    assert updated["reviewed_by"] == "pm@example.com"
    assert updated["reviewed_at"] is not None

    # 2. Update review to REJECTED
    updated_rejected = intelligence_service.update_insight_review(
        workspace_id=workspace_id,
        insight_id=insight_id,
        review_status="REJECTED",
        pm_comment="Duplicate of existing tracking ticket",
        reviewed_by="pm@example.com",
    )
    assert updated_rejected["review_status"] == "REJECTED"
    assert updated_rejected["pm_comment"] == "Duplicate of existing tracking ticket"


def test_get_insight_evidence_fallback():
    workspace_id = "ws-evidence-test"
    dataset_id = "ds-evidence-test"
    insight_id = "PI-EVIDENCE-001"

    doc = ProductInsightModel.create_document(
        workspace_id=workspace_id,
        dataset_id=dataset_id,
        insight_id=insight_id,
        insight_type="HIGH_DEMAND_FEATURE",
        title="Dark mode request",
        summary="Users frequently ask for dark mode.",
        product_area="ui_theme",
        frequency=5,
        percentage_of_feedback=10.0,
        dominant_sentiment="positive",
        severity="low",
        priority_score=60.0,
        priority_level="medium",
        evidence_record_ids=["FB-DARK-1", "FB-DARK-2"],
    )
    intelligence_repository.save_product_insight(doc)

    evidence_res = intelligence_service.get_insight_evidence(workspace_id, insight_id)
    assert evidence_res["insight_id"] == insight_id
    assert evidence_res["total_evidence_records"] == 2
    records = evidence_res["evidence_records"]
    assert len(records) == 2
    assert records[0]["feedback_id"] == "FB-DARK-1"
    assert records[1]["feedback_id"] == "FB-DARK-2"

