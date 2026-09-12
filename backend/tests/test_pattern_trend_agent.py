"""
test_pattern_trend_agent.py
---------------------------
Unit tests for Agent 2 (Pattern & Trend Agent).
"""

import pytest
from app.services.intelligence.clustering_service import clustering_service
from app.services.intelligence.trend_service import trend_service
from app.agents.pattern_trend_agent.agent import PatternTrendAgent


def test_trend_calculation():
    """Test deterministic mathematical trend growth and direction."""
    # Test increase
    pct, direction, strength = trend_service.calculate_change(current_count=18, previous_count=12)
    assert pct == 50.0
    assert direction == "increasing"
    assert strength == "high"

    # Test decrease
    pct, direction, strength = trend_service.calculate_change(current_count=5, previous_count=10)
    assert pct == -50.0
    assert direction == "decreasing"

    # Test new emerging
    pct, direction, strength = trend_service.calculate_change(current_count=6, previous_count=0)
    assert direction == "new"
    assert strength == "high"


def test_issue_clustering_and_evidence_preservation():
    """Test grouping similar issues and preserving supporting record IDs."""
    sample_analyses = [
        {
            "feedback_id": "FB001",
            "analysis": {
                "theme": "checkout",
                "sentiment": "negative",
                "issues": ["Payment failure at checkout"],
                "feature_requests": [],
            },
        },
        {
            "feedback_id": "FB013",
            "analysis": {
                "theme": "checkout",
                "sentiment": "negative",
                "issues": ["Payment confirmation loading indefinitely"],
                "feature_requests": [],
            },
        },
        {
            "feedback_id": "FB021",
            "analysis": {
                "theme": "checkout",
                "sentiment": "negative",
                "issues": ["Transaction failed without error code"],
                "feature_requests": [],
            },
        },
    ]

    clusters = clustering_service.cluster_records(
        sample_analyses, workspace_id="ws-test", dataset_id="ds-test"
    )

    issue_clusters = clusters["issue_clusters"]
    assert len(issue_clusters) >= 1
    main_cluster = issue_clusters[0]
    assert "Payment" in main_cluster["name"] or "Checkout" in main_cluster["name"]
    assert main_cluster["frequency"] == 3
    # Check evidence IDs preserved
    assert set(main_cluster["evidence_record_ids"]) == {"FB001", "FB013", "FB021"}


def test_feature_request_clustering():
    """Test grouping similar feature requests."""
    sample_analyses = [
        {
            "feedback_id": "FB009",
            "analysis": {
                "theme": "dashboard",
                "sentiment": "neutral",
                "issues": [],
                "feature_requests": ["Please add dark mode"],
            },
        },
        {
            "feedback_id": "FB043",
            "analysis": {
                "theme": "dashboard",
                "sentiment": "neutral",
                "issues": [],
                "feature_requests": ["Night theme would be great"],
            },
        },
    ]

    clusters = clustering_service.cluster_records(
        sample_analyses, workspace_id="ws-test", dataset_id="ds-test"
    )

    feature_clusters = clusters["feature_clusters"]
    assert len(feature_clusters) >= 1
    fc = feature_clusters[0]
    assert "Dark Mode" in fc["name"]
    assert fc["request_count"] == 2
    assert set(fc["evidence_record_ids"]) == {"FB009", "FB043"}

