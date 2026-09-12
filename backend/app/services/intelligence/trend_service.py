"""
trend_service.py
----------------
Mathematical period comparison and trend calculation service.
Computes frequency deltas and growth percentages deterministically in Python.
"""

from __future__ import annotations

from typing import Any
from app.core.constants import TrendDirection


class TrendService:
    """Service for deterministic trend calculations and direction identification."""

    @staticmethod
    def calculate_change(
        current_count: int,
        previous_count: int,
    ) -> tuple[float, str, str]:
        """
        Calculate period change percentage, direction, and strength.
        Returns: (change_percentage, direction, trend_strength)
        """
        if previous_count == 0:
            if current_count == 0:
                return 0.0, TrendDirection.STABLE.value, "low"
            # Brand new emerging issue
            return 100.0, TrendDirection.NEW.value, "high" if current_count >= 5 else "medium"

        delta = current_count - previous_count
        percentage = round((delta / previous_count) * 100.0, 1)

        # Direction determination
        if percentage > 15.0:
            if previous_count <= 2 and current_count >= 5:
                direction = TrendDirection.EMERGING.value
            else:
                direction = TrendDirection.INCREASING.value
        elif percentage < -15.0:
            direction = TrendDirection.DECREASING.value
        else:
            direction = TrendDirection.STABLE.value

        # Strength determination
        abs_pct = abs(percentage)
        if abs_pct >= 40.0:
            strength = "high"
        elif abs_pct >= 20.0:
            strength = "medium"
        else:
            strength = "low"

        return percentage, direction, strength


trend_service = TrendService()

