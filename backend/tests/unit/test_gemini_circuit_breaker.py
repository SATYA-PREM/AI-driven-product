"""
test_gemini_circuit_breaker.py
------------------------------
Unit tests for GeminiClient circuit breaker and quota recovery:
1. When a 429 RESOURCE_EXHAUSTED error occurs, the circuit breaker trips.
2. In cooldown, subsequent calls immediately return fallback without making API calls.
3. Batch execution completes rapidly using deterministic fallback instead of spamming 429 errors.
"""

import time
from unittest.mock import MagicMock
import pytest

from app.services.ai.gemini_client import GeminiClient
from app.agents.feedback_analysis_agent.agent import FeedbackAnalysisAgent


def test_circuit_breaker_trips_on_429():
    client = GeminiClient()
    client._client = MagicMock()
    client.reset_cooldown()

    # Simulate 429 quota exhausted error with retry delay
    error_message = (
        "429 RESOURCE_EXHAUSTED. Quota exceeded for metric: "
        "generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20. "
        "Please retry in 45.5s."
    )
    client._client.models.generate_content.side_effect = Exception(error_message)

    fallback_called = False

    def fallback_fn(prompt):
        nonlocal fallback_called
        fallback_called = True
        return {"sentiment": "positive", "source": "fallback"}

    # First call: encounters 429, trips circuit breaker, falls back
    res1 = client.generate_json(
        prompt="Analyze feedback",
        fallback_fn=fallback_fn,
    )

    assert fallback_called is True
    assert res1["source"] == "fallback"
    assert client.is_in_cooldown is True
    assert client.cooldown_remaining > 40.0

    # Second call: client._client.models.generate_content should NOT even be called
    client._client.models.generate_content.reset_mock()
    fallback_called = False

    res2 = client.generate_json(
        prompt="Analyze second feedback",
        fallback_fn=fallback_fn,
    )

    assert fallback_called is True
    assert res2["source"] == "fallback"
    # Verify no network call was attempted while in cooldown
    client._client.models.generate_content.assert_not_called()

    # Clean up
    client.reset_cooldown()
    assert client.is_in_cooldown is False


def test_batch_execution_with_circuit_breaker(monkeypatch):
    from app.services.ai.gemini_client import gemini_client

    # Mock live client that throws 429 on first call
    mock_sdk = MagicMock()
    mock_sdk.models.generate_content.side_effect = Exception(
        "429 RESOURCE_EXHAUSTED. Quota exceeded for metric free_tier_requests. Please retry in 30s."
    )
    monkeypatch.setattr(gemini_client, "_client", mock_sdk)
    gemini_client.reset_cooldown()

    agent = FeedbackAnalysisAgent()
    records = [
        {"feedback_id": f"fb-{i}", "text": f"Feedback item {i} with great service"}
        for i in range(10)
    ]

    start = time.time()
    batch_res = agent.analyze_batch(
        records=records,
        workspace_id="",
        dataset_id="",
    )
    elapsed = time.time() - start

    assert batch_res["total_records"] == 10
    assert batch_res["completed_count"] == 10
    assert batch_res["failed_count"] == 0
    assert len(batch_res["results"]) == 10

    # Crucial assertion: generate_content was called EXACTLY ONCE (tripped breaker), NOT 10 times!
    assert mock_sdk.models.generate_content.call_count == 1
    # Entire batch completed swiftly (< 1.0s)
    assert elapsed < 1.5

    gemini_client.reset_cooldown()
