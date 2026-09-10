from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Any

class CleaningSummaryResponse(BaseModel):
    dataset_id: str
    total_input: int
    cleaned_count: int
    duplicate_count: int
    cleaning_metadata: dict[str, Any]
    cleaned_at: datetime
