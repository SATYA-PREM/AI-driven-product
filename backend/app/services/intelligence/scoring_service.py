"""
scoring_service.py
------------------
Deterministic scoring service for calculating issue severity,
customer impact, and priority scores (0 to 100).
Separates mathematical scoring from LLM semantic interpretation.
"""

from __future__ import annotations

from typing import Any
from app.core.constants import PriorityLevel, SeverityLevel


class ScoringService:
    """
    Deterministic scoring engine implementing the formula:
    Priority Score = Frequency (25) + Severity (25) + Trend (20) + Negative Sentiment (10) + Customer Impact (20)
    """

    def __init__(
        self,
        weight_frequency: float = 25.0,
        weight_severity: float = 25.0,
        weight_trend: float = 20.0,
        weight_sentiment: float = 10.0,
        weight_impact: float = 20.0,
    ):
        self.weight_frequency = weight_frequency
        self.weight_severity = weight_severity
        self.weight_trend = weight_trend
        self.weight_sentiment = weight_sentiment
        self.weight_impact = weight_impact

    def calculate_priority_score(
        self,
        frequency: int,
        total_records: int,
        severity: str,
        trend_direction: str,
        trend_percentage: float,
        negative_ratio: float,
        customer_impact: str,
    ) -> tuple[float, str]:
        """
        Calculate total priority score (0-100) and assign a priority level.
        Returns: (priority_score, priority_level)
        """
        # 1. Frequency Score (0 to weight_frequency)
        # Ratio of total feedback or scaled count
        freq_ratio = min(frequency / max(total_records, 1) * 3.0, 1.0) if total_records > 0 else min(frequency / 20.0, 1.0)
        freq_score = freq_ratio * self.weight_frequency

        # 2. Severity Score (0 to weight_severity)
        severity_map = {
            "low": 0.25,
            "medium": 0.50,
            "high": 0.80,
            "critical": 1.0,
        }
        sev_score = severity_map.get(severity.lower(), 0.5) * self.weight_severity

        # 3. Trend Score (0 to weight_trend)
        trend_dir = trend_direction.lower()
        if trend_dir in ["increasing", "emerging"]:
            trend_multiplier = 0.8 + min(max(trend_percentage, 0.0) / 100.0 * 0.2, 0.2)
        elif trend_dir == "stable":
            trend_multiplier = 0.5
        elif trend_dir == "new":
            trend_multiplier = 0.7
        else:  # decreasing / declining
            trend_multiplier = 0.2
        trend_score = trend_multiplier * self.weight_trend

        # 4. Sentiment Score (0 to weight_sentiment)
        # Higher negative sentiment ratio yields higher priority score
        sent_score = min(max(negative_ratio, 0.0), 1.0) * self.weight_sentiment

        # 5. Customer Impact Score (0 to weight_impact)
        impact_map = {
            "low": 0.25,
            "medium": 0.50,
            "high": 0.80,
            "critical": 1.0,
        }
        imp_score = impact_map.get(customer_impact.lower(), 0.5) * self.weight_impact

        total_score = round(freq_score + sev_score + trend_score + sent_score + imp_score, 1)
        total_score = max(0.0, min(total_score, 100.0))

        # Assign priority level:
        # 0–30: LOW, 31–60: MEDIUM, 61–80: HIGH, 81–100: CRITICAL
        if total_score >= 81.0:
            level = PriorityLevel.CRITICAL.value
        elif total_score >= 61.0:
            level = PriorityLevel.HIGH.value
        elif total_score >= 31.0:
            level = PriorityLevel.MEDIUM.value
        else:
            level = PriorityLevel.LOW.value

        return total_score, level

    def determine_severity_from_keywords(self, text: str) -> str:
        """Heuristic rule-based severity estimator for baseline analysis."""
        lower = text.lower()
        if any(k in lower for k in ["crash", "security", "data loss", "payment fail", "freeze", "down"]):
            return SeverityLevel.HIGH.value
        if any(k in lower for k in ["error", "bug", "fail", "slow", "broken", "stuck", "cannot"]):
            return SeverityLevel.MEDIUM.value
        return SeverityLevel.LOW.value


scoring_service = ScoringService()

