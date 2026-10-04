"""
assistant_job.py
----------------
Data models for asynchronous AI Assistant jobs.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantJob(BaseModel):
    """Tracks asynchronous background assistant queries."""
    job_id: str
    workspace_id: str
    category_id: Optional[str] = None
    user_id: Optional[str] = None
    question: str
    status: str = "PENDING"  # PENDING | RUNNING | COMPLETED | FAILED
    stage: str = "UNDERSTANDING_QUESTION"
    progress: int = 10
    mode: str = "DYNAMIC_ANALYSIS"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

