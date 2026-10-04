"""
assistant.py
------------
Pydantic schemas for AI Assistant query requests and responses.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantSource(BaseModel):
    """Source reference supporting the assistant answer."""
    type: str  # 'insight' | 'feedback' | 'prd' | 'requirement' | 'trend'
    id: str
    title: Optional[str] = None
    quote: Optional[str] = None
    score: Optional[float] = None
    source: Optional[str] = None


class StructuredData(BaseModel):
    """Rich structured data payload for UI cards and charts."""
    top_issues: Optional[List[Dict[str, Any]]] = None
    sentiment_distribution: Optional[Dict[str, Any]] = None
    example_feedback: Optional[List[Dict[str, Any]]] = None
    ai_insights: Optional[List[str]] = None
    recommended_actions: Optional[List[Dict[str, Any]]] = None
    prd_summary: Optional[Dict[str, Any]] = None
    trends: Optional[List[Dict[str, Any]]] = None


class AssistantQueryRequest(BaseModel):
    """User prompt request for the AI Assistant."""
    workspace_id: str
    category_id: Optional[str] = "all"
    message: str
    session_id: Optional[str] = None
    scope: Optional[str] = "all"  # 'all' | 'insights' | 'prds' | 'feedback'


class AssistantQueryResponse(BaseModel):
    """Structured response returned by the AI Assistant."""
    session_id: str
    message_id: str
    answer: str
    sources: List[AssistantSource] = Field(default_factory=list)
    confidence: float = 0.95
    mode: str = "FAST_RETRIEVAL"  # FAST_RETRIEVAL | DYNAMIC_ANALYSIS
    structured_data: Optional[StructuredData] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssistantMessageResponse(BaseModel):
    """Single chat message in a session."""
    id: str
    session_id: str
    sender: str  # 'user' | 'ai'
    text: str
    mode: Optional[str] = None
    sources: List[AssistantSource] = Field(default_factory=list)
    structured_data: Optional[StructuredData] = None
    confidence: Optional[float] = None
    time: Optional[str] = None
    created_at: datetime


class AssistantSessionCreate(BaseModel):
    """Create session payload."""
    workspace_id: str
    category_id: Optional[str] = None
    title: Optional[str] = "New Assistant Session"


class AssistantSessionResponse(BaseModel):
    """Session details."""
    id: str
    workspace_id: str
    category_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime

