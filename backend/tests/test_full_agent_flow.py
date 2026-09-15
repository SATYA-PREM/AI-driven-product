import uuid
import pytest
from app.core.database import (
    analyses_collection,
    issue_clusters_collection,
    feature_clusters_collection,
    trends_collection,
    product_insights_collection,
)
from app.agents.feedback_analysis_agent.agent import feedback_analysis_agent
from app.agents.pattern_trend_agent.agent import pattern_trend_agent
from app.agents.product_intelligence_agent.agent import product_intelligence_agent


def test_full_3_agent_flow_with_mongodb_storage():
    """Verify end-to-end execution of Agent 1 -> Agent 2 -> Agent 3 with MongoDB storage."""
    ws_id = f"test-ws-{uuid.uuid4().hex[:6]}"
    ds_id = f"test-ds-{uuid.uuid4().hex[:6]}"

    test_records = [
        {
            "feedback_id": "TEST-001",
            "text": "The checkout payment gateway keeps failing with timeout error when using Mastercard.",
            "rating": 1,
            "metadata": {"module": "checkout", "customer_segment": "enterprise"},
        },
        {
            "feedback_id": "TEST-002",
            "text": "Checkout crashed while processing my debit card payment. Lost my cart items.",
            "rating": 1,
            "metadata": {"module": "checkout", "customer_segment": "smb"},
        },
        {
            "feedback_id": "TEST-003",
            "text": "Please add automatic card retry on checkout failure so we do not have to retype.",
            "rating": 4,
            "metadata": {"module": "checkout", "customer_segment": "enterprise"},
        },
        {
            "feedback_id": "TEST-004",
            "text": "The product search bar takes over 15 seconds to return results, very slow.",
            "rating": 2,
            "metadata": {"module": "search", "customer_segment": "consumer"},
        },
        {
            "feedback_id": "TEST-005",
            "text": "Search filter crashes when filtering by price range and brand simultaneously.",
            "rating": 1,
            "metadata": {"module": "search", "customer_segment": "smb"},
        },
        {
            "feedback_id": "TEST-006",
            "text": "Can you add AI autocomplete and typo tolerance to search?",
            "rating": 4,
            "metadata": {"module": "search", "customer_segment": "consumer"},
        },
    ]

    # 1. Stage 1: Feedback Analysis Agent
    for rec in test_records:
        res = feedback_analysis_agent.analyze_record(rec, workspace_id=ws_id, dataset_id=ds_id)
        assert res is not None
        assert res.get("feedback_id") == rec["feedback_id"]
        assert res.get("sentiment") in ["positive", "negative", "neutral", "mixed"]

    analyses_count = analyses_collection.count_documents({"dataset_id": ds_id})
    assert analyses_count == len(test_records)

    # 2. Stage 2: Pattern & Trend Agent
    p_res = pattern_trend_agent.analyze_patterns(dataset_id=ds_id, workspace_id=ws_id)
    assert p_res is not None
    assert p_res.get("status") == "completed"

    issues_count = issue_clusters_collection.count_documents({"dataset_id": ds_id})
    features_count = feature_clusters_collection.count_documents({"dataset_id": ds_id})
    assert issues_count >= 1 or features_count >= 1

    # 3. Stage 3: Product Intelligence Agent
    pi_res = product_intelligence_agent.generate_product_intelligence(workspace_id=ws_id, dataset_id=ds_id)
    assert pi_res is not None
    assert pi_res.get("status") == "completed"

    insights_count = product_insights_collection.count_documents({"dataset_id": ds_id})
    assert insights_count >= 1

    # 4. Verify MongoDB Stored Insight has all 10 Decision Fields
    sample_ins = product_insights_collection.find_one({"dataset_id": ds_id})
    assert sample_ins is not None
    assert "business_impact" in sample_ins
    assert "feature_opportunity" in sample_ins
    assert "product_recommendation" in sample_ins
    assert "root_cause" in sample_ins
    assert sample_ins["root_cause"].get("status") == "hypothesis"
    assert "affected_feature" in sample_ins
    assert "evidence" in sample_ins
    assert len(sample_ins["evidence"].get("record_ids", [])) >= 1
    assert "confidence" in sample_ins
    assert "recommended_next_steps" in sample_ins
    assert "priority" in sample_ins
    assert "trend" in sample_ins

