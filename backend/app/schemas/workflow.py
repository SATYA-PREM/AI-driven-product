from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel

class WorkflowStepResponse(BaseModel):
    name: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None

class WorkflowResponse(BaseModel):
    id: str
    workspace_id: str
    product_id: str
    dataset_id: str
    steps: list[WorkflowStepResponse]
    current_step: str
    overall_status: str
    progress_percentage: float
    created_at: datetime
    updated_at: datetime
