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
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiClient:
    """Client for interacting with Google Gemini models."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"
        self._client = None

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

    def generate_json(
        self,
        prompt: str,
        system_instruction: str = "",
        fallback_fn: Any = None,
    ) -> dict[str, Any]:
        """
        Generate structured JSON from Gemini.
        Falls back to fallback_fn(prompt) if offline or upon error.
        """
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

