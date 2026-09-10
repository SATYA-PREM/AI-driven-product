"""
Unit tests for Gemini semantic preprocessing and AI-readiness checker.
"""

from app.services.preprocessing.gemini_checker import gemini_checker


def test_gemini_checker_heuristic_evaluation():
    samples = [
        {"signal_id": "sig-1", "text": "Very clean user interface with high performance.", "rating": 5, "source_type": "feedback"},
        {"signal_id": "sig-2", "text": "Checkout payment failed multiple times.", "rating": 1, "source_type": "feedback"}
    ]

    result = gemini_checker._evaluate_heuristically(
        dataset_id="test_ds_99",
        total_signals=2,
        samples=samples
    )

    assert result["dataset_id"] == "test_ds_99"
    assert result["total_signals"] == 2
    assert "ai_readiness_score" in result
    assert "sentiment_distribution" in result
    assert "quality_summary" in result
    assert result["ai_readiness_score"] >= 50.0

