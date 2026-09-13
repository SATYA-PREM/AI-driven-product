"""
gemini_client.py
----------------
Wrapper around the official Google GenAI SDK (google-genai) with structured
JSON generation, error recovery, and deterministic offline fallback for
tests or environments without a configured API key.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiClient:
    """Client for interacting with Google Gemini models with circuit-breaker quota protection."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        self._cooldown_until: float = 0.0

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"GeminiClient initialized with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize official genai.Client: {e}")
                self._client = None
        else:
            logger.info("GeminiClient: No GEMINI_API_KEY provided; operating in mock/fallback mode.")

    @property
    def is_available(self) -> bool:
        """Returns True if a live Gemini client is configured."""
        return self._client is not None

    @property
    def is_in_cooldown(self) -> bool:
        """Returns True if API rate-limit circuit breaker is currently active."""
        return time.time() < self._cooldown_until

    @property
    def cooldown_remaining(self) -> float:
        """Seconds remaining until circuit breaker cools down."""
        return max(0.0, self._cooldown_until - time.time())

    def reset_cooldown(self) -> None:
        """Manually reset the circuit breaker."""
        self._cooldown_until = 0.0

    def generate_json(
        self,
        prompt: str,
        system_instruction: str = "",
        fallback_fn: Any = None,
    ) -> dict[str, Any]:
        """
        Generate structured JSON from Gemini.
        Falls back immediately to fallback_fn(prompt) if offline, in cooldown, or upon error.
        """
        # Circuit breaker check: if rate-limited recently, bypass network call immediately
        if self.is_in_cooldown:
            if fallback_fn is not None:
                return fallback_fn(prompt)
            return {}

        if self._client:
            try:
                # Use official google-genai SDK
                config = {
                    "response_mime_type": "application/json",
                }
                if system_instruction:
                    config["system_instruction"] = system_instruction

                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )
                text = response.text or ""
                return self._parse_json(text)
            except Exception as e:
                err_str = str(e)
                # Check for 429 / RESOURCE_EXHAUSTED / quota limits
                is_quota_error = (
                    "429" in err_str
                    or "RESOURCE_EXHAUSTED" in err_str
                    or "quota" in err_str.lower()
                    or "rate limit" in err_str.lower()
                )
                if is_quota_error:
                    # Attempt to extract suggested retry delay from error message
                    match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_str, re.IGNORECASE)
                    retry_seconds = float(match.group(1)) + 2.0 if match else 60.0
                    self._cooldown_until = time.time() + retry_seconds
                    logger.warning(
                        f"Gemini API rate/quota limit reached (429 RESOURCE_EXHAUSTED). "
                        f"Circuit breaker tripped for {retry_seconds:.1f}s. "
                        f"Fast offline fallback will be used for all subsequent calls without spamming network."
                    )
                else:
                    logger.warning(f"Gemini API call failed: {e}. Attempting fallback parser.")

        # Fallback handling
        if fallback_fn is not None:
            return fallback_fn(prompt)

        return {}

    def _parse_json(self, text: str) -> dict[str, Any]:
        """Sanitize and parse JSON string from model response."""
        text = text.strip()
        # Remove markdown code fences if present
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
            text = text.strip()

        try:
            return json.loads(text)
        except Exception:
            # Attempt to extract first outer JSON object
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            raise ValueError(f"Could not parse valid JSON from LLM response: {text[:200]}")


gemini_client = GeminiClient()

