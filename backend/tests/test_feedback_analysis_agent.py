"""
test_feedback_analysis_agent.py
-------------------------------
Unit tests for Agent 1 (Feedback Analysis Agent).
"""

import pytest
from app.schemas.analysis import FeedbackAnalysisOutput
from app.agents.feedback_analysis_agent.agent import FeedbackAnalysisAgent
from app.agents.feedback_analysis_agent import tools


def test_feedback_analysis_schema_valid():
    """Test that a valid Agent 1 output dictionary passes Pydantic validation."""
    valid_data = {
        "feedback_id": "FB013",
        "sentiment": "negative",
        "sentiment_confidence": 0.94,
        "intent": "complaint",
        "intent_confidence": 0.91,
        "theme": "checkout",
        "theme_confidence": 0.93,
        "product_area": "payment_confirmation",
        "pain_points": ["Customer cannot determine whether payment succeeded"],
        "issues": ["Payment confirmation state is unclear"],
        "feature_requests": ["Provide a clear payment-success confirmation"],
        "keywords": ["payment", "confirmation", "loading", "order"],
        "overall_confidence": 0.92,
    }
    is_valid, validated_model, errors = tools.validate_feedback_analysis(valid_data)
    assert is_valid is True
    assert errors == []
    assert validated_model is not None
    assert validated_model.feedback_id == "FB013"
    assert validated_model.sentiment == "negative"
    assert validated_model.overall_confidence == 0.92


def test_feedback_analysis_schema_invalid_confidence():
    """Test that an out-of-bounds confidence score fails validation."""
    invalid_data = {
        "feedback_id": "FB013",
        "sentiment": "negative",
        "sentiment_confidence": 1.45,  # Invalid: > 1.0
        "intent": "complaint",
        "intent_confidence": 0.91,
        "theme": "checkout",
        "theme_confidence": 0.93,
        "product_area": "payment_confirmation",
        "pain_points": [],
        "issues": [],
        "feature_requests": [],
        "keywords": [],
        "overall_confidence": 0.92,
    }
    is_valid, validated_model, errors = tools.validate_feedback_analysis(invalid_data)
    assert is_valid is False
    assert validated_model is None
    assert len(errors) > 0


def test_feedback_analysis_schema_invalid_sentiment():
    """Test that an unallowed sentiment category fails validation."""
    invalid_data = {
        "feedback_id": "FB013",
        "sentiment": "furious",  # Invalid: not in positive/negative/neutral/mixed
        "sentiment_confidence": 0.90,
        "intent": "complaint",
        "intent_confidence": 0.91,
        "theme": "checkout",
        "theme_confidence": 0.93,
        "product_area": "payment_confirmation",
        "pain_points": [],
        "issues": [],
        "feature_requests": [],
        "keywords": [],
        "overall_confidence": 0.90,
    }
    is_valid, validated_model, errors = tools.validate_feedback_analysis(invalid_data)
    assert is_valid is False
    assert validated_model is None


def test_agent_1_analyze_record():
    """Test that Agent 1 analyzes an individual feedback record accurately."""
    agent = FeedbackAnalysisAgent()
    record = {
        "feedback_id": "FB013",
        "text": "I completed the payment but the screen kept loading and I wasn't sure if the order succeeded.",
        "module": "Checkout",
        "rating": 2,
    }
    result = agent.analyze_record(record)
    assert result["feedback_id"] == "FB013"
    assert result["sentiment"] in ["negative", "mixed"]
    assert 0.0 <= result["overall_confidence"] <= 1.0
    assert len(result["keywords"]) > 0


def test_agent_1_batch_processing():
    """Test Agent 1 batch processing with multiple records."""
    agent = FeedbackAnalysisAgent()
    records = [
        {"feedback_id": "FB001", "text": "Payment failed during checkout with card error.", "rating": 1},
        {"feedback_id": "FB002", "text": "I love the new search feature, it is super fast!", "rating": 5},
        {"feedback_id": "FB003", "text": "Can you please add dark mode support?", "rating": 4},
    ]
    batch_res = agent.analyze_batch(records, workspace_id="ws-test", dataset_id="ds-test")
    assert batch_res["total_records"] == 3
    assert batch_res["completed_count"] == 3
    assert batch_res["failed_count"] == 0
    assert len(batch_res["results"]) == 3

