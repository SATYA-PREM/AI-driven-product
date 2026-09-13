"""
test_product_intelligence_agent.py
----------------------------------
Unit tests for Agent 3 (Product Intelligence Agent).
"""

import pytest
from app.services.intelligence.scoring_service import scoring_service
from app.services.intelligence.insight_service import insight_service
from app.schemas.intelligence import ProductInsightOutput


def test_priority_score_calculation():
    """Test deterministic priority score calculation (0 to 100)."""
    # High impact, high severity, increasing trend
    score, level = scoring_service.calculate_priority_score(
        frequency=18,
        total_records=25,
        severity="high",
        trend_direction="increasing",
        trend_percentage=32.5,
        negative_ratio=0.88,
        customer_impact="high",
    )
    assert 70.0 <= score <= 100.0
    assert level in ["high", "critical"]

    # Low severity, low frequency, stable trend
    low_score, low_level = scoring_service.calculate_priority_score(
        frequency=2,
        total_records=100,
        severity="low",
        trend_direction="stable",
        trend_percentage=0.0,
        negative_ratio=0.1,
        customer_impact="low",
    )
    assert low_score < 40.0
    assert low_level in ["low", "medium"]


def test_mandatory_evidence_rule():
    """Test that ProductInsightOutput strictly requires at least 1 evidence record ID."""
    # Missing evidence should fail validation
    with pytest.raises(Exception):
        ProductInsightOutput(
            insight_id="PI-001",
            insight_type="HIGH_PRIORITY_ISSUE",
            title="Payment problems",
            summary="Payment failures reported",
            product_area="checkout",
            frequency=18,
            dominant_sentiment="negative",
            severity="high",
            priority_score=87.0,
            priority_level="high",
            customer_impact="high",
            evidence_record_ids=[],  # Empty list violates min_length=1
            recommended_action="Investigate checkout flow",
        )

    # Valid evidence list should succeed
    valid_insight = ProductInsightOutput(
        insight_id="PI-001",
        insight_type="HIGH_PRIORITY_ISSUE",
        title="Payment problems",
        summary="Payment failures reported",
        product_area="checkout",
        frequency=18,
        dominant_sentiment="negative",
        severity="high",
        priority_score=87.0,
        priority_level="high",
        customer_impact="high",
        evidence_record_ids=["FB001", "FB013"],
        recommended_action="Investigate checkout flow",
    )
    assert valid_insight.insight_id == "PI-001"
    assert len(valid_insight.evidence_record_ids) == 2


def test_generate_insights_from_clusters():
    """Test generating prioritized insights from issue clusters."""
    issue_clusters = [
        {
            "cluster_id": "ISSUE-001",
            "name": "Payment Problems",
            "frequency": 18,
            "percentage_of_feedback": 36.0,
            "trend": "increasing",
            "trend_percentage": 50.0,
            "sentiment_summary": {"negative": 16, "neutral": 2},
            "evidence_record_ids": ["FB001", "FB013", "FB031"],
        }
    ]
    feature_clusters = [
        {
            "cluster_id": "FEATURE-001",
            "name": "Dark Mode",
            "request_count": 14,
            "percentage_of_requests": 28.0,
            "trend": "increasing",
            "trend_percentage": 20.0,
            "evidence_record_ids": ["FB009", "FB021"],
        }
    ]

    insights = insight_service.generate_insights_from_clusters(
        issue_clusters=issue_clusters,
        feature_clusters=feature_clusters,
        trends=[],
        workspace_id="ws-test",
        dataset_id="ds-test",
        total_records=50,
    )

    assert len(insights) == 2
    # Ensure insights are sorted by priority score descending
    assert insights[0]["priority_score"] >= insights[1]["priority_score"]
    # Check that evidence IDs are populated
    for ins in insights:
        assert len(ins["evidence_record_ids"]) >= 1
        assert "recommended_action" in ins


def test_intelligence_service_features_and_sentiment():
    """Test intelligence_service get_features, get_sentiment, and summary."""
    from app.services.intelligence.intelligence_service import intelligence_service
    from app.repositories.analysis_repository import analysis_repository

    # Mock analyses in memory
    analysis_repository.save_analysis({
        "dataset_id": "ds-unit-test",
        "workspace_id": "ws-unit-test",
        "feedback_id": "FB-U1",
        "analysis": {
            "sentiment": "positive",
            "intent": "feature_request",
            "theme": "reporting",
            "issues": [],
            "feature_requests": ["Can we schedule automatic exports?"],
        }
    })
    analysis_repository.save_analysis({
        "dataset_id": "ds-unit-test",
        "workspace_id": "ws-unit-test",
        "feedback_id": "FB-U2",
        "analysis": {
            "sentiment": "negative",
            "intent": "complaint",
            "theme": "checkout",
            "issues": ["Payment timeout"],
            "feature_requests": [],
        }
    })

    # Test sentiment across dataset and workspace
    sent_ds = intelligence_service.get_sentiment("ws-unit-test", "ds-unit-test")
    assert sent_ds["total_count"] >= 2
    assert sent_ds["distribution"]["positive"] >= 1
    assert sent_ds["distribution"]["negative"] >= 1

    sent_ws = intelligence_service.get_sentiment("ws-unit-test")
    assert sent_ws["total_count"] >= 2

    # Test features resolution
    features = intelligence_service.get_features("ws-unit-test", "ds-unit-test")
    assert len(features) >= 1
    assert any("Schedule" in f.get("name", "") or "Export" in f.get("name", "") or "Reporting" in f.get("name", "") for f in features)

    # Test summary overview
    summary = intelligence_service.get_workspace_intelligence_summary("ws-unit-test", "ds-unit-test")
    assert summary["summary"]["total_feedback_analyzed"] >= 2
    assert "top_features" in summary
    assert "top_issues" in summary


def test_report_generation_and_retrieval():
    """Test report_service generates complete report with KPIs and persists to repository."""
    from app.services.reporting.report_service import report_service

    report = report_service.generate_product_report(workspace_id="ws-unit-test")
    assert report["report_id"].startswith("REP-")
    assert report["summary_kpis"]["total_signals_analyzed"] >= 2
    assert len(report["prioritized_issues"]) >= 0
    assert len(report["feature_demand_ranking"]) >= 0
    assert "positive" in report["sentiment_overview"]

    latest = report_service.get_latest_report(workspace_id="ws-unit-test")
    assert latest is not None
    assert latest["report_id"] == report["report_id"]

