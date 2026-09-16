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


class AIAgentStatus(BaseModel):
    feedback_analysis: str = "pending"
    pattern_trend: str = "pending"
    product_intelligence: str = "pending"


class AIJobResponse(BaseModel):
    id: str | None = None
    job_id: str
    workspace_id: str
    dataset_id: str
    status: str
    current_agent: str | None = None
    agents: dict[str, str] = {
        "feedback_analysis": "pending",
        "pattern_trend": "pending",
        "product_intelligence": "pending",
    }
    step_progress: dict[str, Any] = {}
    stage_outputs: dict[str, Any] = {}
    summary: dict[str, Any] = {}
    analysis_version: str = "v1"
    error: str | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None
    completed_at: datetime | str | None = None

    model_config = ConfigDict(extra="ignore")
