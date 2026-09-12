"""
tools.py
--------
Controlled tools for Agent 2 (Pattern & Trend Agent).
Provides controlled database and computational operations.
"""

from __future__ import annotations

from typing import Any
from app.repositories.analysis_repository import analysis_repository
from app.repositories.intelligence_repository import intelligence_repository
from app.services.intelligence.trend_service import trend_service


def get_analysis_records(dataset_id: str, limit: int = 500) -> list[dict[str, Any]]:
    """Retrieve validated feedback analyses for a dataset."""
    return analysis_repository.get_by_dataset_id(dataset_id, skip=0, limit=limit)


def get_analysis_summary(dataset_id: str) -> dict[str, Any]:
    """Retrieve count and sentiment distribution."""
    total = analysis_repository.count_by_dataset(dataset_id)
    sentiments = analysis_repository.get_sentiment_distribution(dataset_id)
    return {
        "total_records": total,
        "sentiment_distribution": sentiments,
    }


def calculate_frequency(items: list[str]) -> list[tuple[str, int]]:
    """Calculate frequency count of distinct strings."""
    counts: dict[str, int] = {}
    for item in items:
        clean = item.strip()
        if clean:
            counts[clean] = counts.get(clean, 0) + 1
    return sorted(counts.items(), key=lambda x: x[1], reverse=True)


def calculate_trend(current_count: int, previous_count: int) -> tuple[float, str, str]:
    """Calculate trend percentage, direction, and strength."""
    return trend_service.calculate_change(current_count, previous_count)


def save_issue_cluster(cluster_data: dict[str, Any]) -> str:
    """Save an issue cluster to MongoDB."""
    return intelligence_repository.save_issue_cluster(cluster_data)


def save_feature_cluster(cluster_data: dict[str, Any]) -> str:
    """Save a feature cluster to MongoDB."""
    return intelligence_repository.save_feature_cluster(cluster_data)


def save_trend(trend_data: dict[str, Any]) -> str:
    """Save a trend to MongoDB."""
    return intelligence_repository.save_trend(trend_data)


def save_theme_pattern(pattern_data: dict[str, Any]) -> str:
    """Save a theme pattern to MongoDB."""
    return intelligence_repository.save_theme_pattern(pattern_data)

