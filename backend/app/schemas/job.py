from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any


class JobStatusResponse(BaseModel):
    id: str | None = None
    job_id: str | None = None
    dataset_id: str
    workspace_id: str
    job_type: str = "full_pipeline"
    current_step: str
    status: str
    progress: float = 0.0
    step_results: dict[str, Any] = {}
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(extra="ignore")
