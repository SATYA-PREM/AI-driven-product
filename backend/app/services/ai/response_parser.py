"""
response_parser.py
------------------
Sanitizer and Pydantic validator for responses from LLMs across all 3 agents.
"""

from __future__ import annotations

import json
import re
from typing import Any, Type, TypeVar
from pydantic import BaseModel, ValidationError

from app.core.logging import get_logger
from app.schemas.analysis import FeedbackAnalysisOutput
from app.schemas.intelligence import IssueClusterOutput, FeatureClusterOutput, ProductInsightOutput

logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)


class ResponseParser:
    """Parser and validator for LLM structured outputs."""

    @staticmethod
    def parse_and_validate(data: dict[str, Any] | str, model_cls: Type[T]) -> tuple[bool, T | None, list[str]]:
        """
        Validate data against a given Pydantic model.
        Returns: (is_valid, validated_model_or_none, error_messages)
        """
        if isinstance(data, str):
            # Clean possible markdown block
            text = data.strip()
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
                text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
                text = text.strip()
            try:
                data = json.loads(text)
            except Exception as e:
                return False, None, [f"Invalid JSON string: {e}"]

        try:
            instance = model_cls.model_validate(data)
            return True, instance, []
        except ValidationError as ve:
            errors = [f"{err['loc']}: {err['msg']}" for err in ve.errors()]
            logger.warning(f"Schema validation failed for {model_cls.__name__}: {errors}")
            return False, None, errors

    @staticmethod
    def validate_feedback_analysis(data: dict[str, Any]) -> tuple[bool, FeedbackAnalysisOutput | None, list[str]]:
        """Validate Agent 1 feedback analysis output."""
        return ResponseParser.parse_and_validate(data, FeedbackAnalysisOutput)

    @staticmethod
    def validate_product_insight(data: dict[str, Any]) -> tuple[bool, ProductInsightOutput | None, list[str]]:
        """Validate Agent 3 product insight output."""
        return ResponseParser.parse_and_validate(data, ProductInsightOutput)


response_parser = ResponseParser()

