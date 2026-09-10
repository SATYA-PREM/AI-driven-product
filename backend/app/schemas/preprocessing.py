from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any


class PreprocessingSummaryResponse(BaseModel):
    id: str | None = None
    dataset_id: str
    total_input: int
    processed_count: int
    preprocessing_metadata: dict[str, Any] = {}
    processed_at: datetime | None = None

    model_config = ConfigDict(extra="ignore")


class AICheckResponse(BaseModel):
    dataset_id: str
    total_signals: int
    ai_readiness_score: float
    data_coherence: str | None = None
    dominant_themes: list[str] = []
    sentiment_distribution: dict[str, Any] = {}
    quality_summary: str
    recommendations: list[str] = []
    evaluator: str
    fallback_reason: str | None = None
    checked_at: str

    model_config = ConfigDict(extra="ignore")

