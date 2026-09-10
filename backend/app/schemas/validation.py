from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class ValidationRecordResponse(BaseModel):
    record_id: str | None = None
    row_number: int
    status: str
    errors: list[str] = []
    warnings: list[str] = []

    model_config = ConfigDict(extra="ignore")


class ValidationSummaryResponse(BaseModel):
    id: str | None = None
    dataset_id: str
    workspace_id: str | None = None
    total_records: int
    valid_count: int
    invalid_count: int
    warning_count: int
    duplicate_count: int
    quality_score: float
    validated_at: datetime

    model_config = ConfigDict(extra="ignore")


class ValidationDetailResponse(ValidationSummaryResponse):
    record_results: list[ValidationRecordResponse] = []
