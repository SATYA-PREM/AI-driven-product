"""
assistant_request.py
--------------------
Data models for AI Assistant sessions and messages.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    """Represents a single turn in an assistant conversation."""
    id: Optional[str] = None
    session_id: str
    user_id: Optional[str] = None
    workspace_id: str
    category_id: Optional[str] = None
    question: str
    answer: str
    mode: str = "FAST_RETRIEVAL"  # FAST_RETRIEVAL | DYNAMIC_ANALYSIS
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    structured_data: Optional[Dict[str, Any]] = None
    confidence: float = 0.95
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssistantSession(BaseModel):
    """Represents an assistant chat session for a workspace."""
    id: Optional[str] = None
    workspace_id: str
    user_id: Optional[str] = None
    category_id: Optional[str] = None
    title: str = "New Assistant Session"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

