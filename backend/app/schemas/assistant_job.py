"""
assistant_job.py
----------------
Pydantic schemas for async Assistant Job queries and status tracking.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantJobCreate(BaseModel):
    """Payload to trigger an asynchronous assistant job."""
    workspace_id: str
    category_id: Optional[str] = "all"
    message: str
    scope: Optional[str] = "all"


class AssistantJobResponse(BaseModel):
    """Initial response when an async assistant job is launched."""
    job_id: str
    workspace_id: str
    category_id: Optional[str] = None
    status: str
    stage: str
    progress: int
    created_at: datetime


class AssistantJobStatusResponse(BaseModel):
    """Polling status response for an assistant job."""
    job_id: str
    workspace_id: str
    category_id: Optional[str] = None
    status: str  # PENDING | RUNNING | COMPLETED | FAILED
    stage: str
    progress: int
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

