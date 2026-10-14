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

        from app.services.ai.gemini_pool import gemini_pool

        config = {
            "response_mime_type": "application/json",
        }
        if system_instruction:
            config["system_instruction"] = system_instruction

        candidate_models = [
            self.model_name or "gemini-3.5-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.1-flash-lite-preview",
            "gemini-3.8-flash",
            "gemini-1.5-flash",
        ]
        seen = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

        def _do_call(client, active_key):
            for model in models_to_try:
                try:
                    resp = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=config,
                    )
                    text = resp.text or ""
                    if text.strip():
                        return self._parse_json(text)
                except Exception as ex:
                    ex_str = str(ex).lower()
                    if any(term in ex_str for term in ["429", "resource_exhausted", "quota", "rate limit"]):
                        raise ex
                    if any(term in ex_str for term in ["404", "not found", "no longer available"]):
                        continue
                    logger.warning(f"Model {model} failed on key {active_key[:8]}...: {ex}")
            raise RuntimeError("Exhausted all models on this key")

        try:
            return gemini_pool.execute_with_failover(_do_call)
        except Exception as e:
            logger.warning(f"All Gemini API keys failed in pool: {e}. Attempting fallback.")

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

