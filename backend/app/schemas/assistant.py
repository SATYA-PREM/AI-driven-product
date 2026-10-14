"""
assistant.py
------------
Pydantic schemas for AI Assistant query requests and responses.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class AssistantSource(BaseModel):
    """Source reference supporting the assistant answer."""
    type: str  # 'insight' | 'feedback' | 'prd' | 'requirement' | 'trend'
    id: str
    model_config = ConfigDict(extra="allow")

    type: Optional[str] = "insight"  # 'insight' | 'feedback' | 'prd' | 'requirement' | 'trend' | 'issue'
    id: Optional[str] = ""
    title: Optional[str] = None
    quote: Optional[str] = None
    score: Optional[float] = None
    source: Optional[str] = None


class StructuredData(BaseModel):
    """Rich structured data payload for UI cards and charts."""
    model_config = ConfigDict(extra="allow")

    top_issues: Optional[List[Dict[str, Any]]] = None
    sentiment_distribution: Optional[Dict[str, Any]] = None
    example_feedback: Optional[List[Dict[str, Any]]] = None
    ai_insights: Optional[List[str]] = None
    recommended_actions: Optional[List[Dict[str, Any]]] = None
    prd_summary: Optional[Dict[str, Any]] = None
    trends: Optional[List[Dict[str, Any]]] = None
    refer_buttons: Optional[List[Dict[str, Any]]] = None


class AssistantQueryRequest(BaseModel):
    """User prompt request for the AI Assistant."""
    model_config = ConfigDict(extra="allow")

    workspace_id: Optional[str] = None
    category_id: Optional[str] = "all"
    message: str
    session_id: Optional[str] = None
    scope: Optional[str] = "all"  # 'all' | 'insights' | 'prds' | 'feedback'
    history: Optional[List[Dict[str, Any]]] = None


class AssistantQueryResponse(BaseModel):
    """Structured response returned by the AI Assistant."""
    model_config = ConfigDict(extra="allow")

    session_id: str
    message_id: str
    answer: str
    sources: List[AssistantSource] = Field(default_factory=list)
    sources: List[Union[AssistantSource, Dict[str, Any]]] = Field(default_factory=list)
    confidence: float = 0.95
    mode: str = "FAST_RETRIEVAL"  # FAST_RETRIEVAL | DYNAMIC_ANALYSIS
    structured_data: Optional[StructuredData] = None
    structured_data: Optional[Union[StructuredData, Dict[str, Any]]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssistantMessageResponse(BaseModel):
    """Single chat message in a session."""
    model_config = ConfigDict(extra="allow")

    id: str
    session_id: str
    sender: str  # 'user' | 'ai'
    sender: str = "ai"  # 'user' | 'ai'
    text: str
    mode: Optional[str] = None
    sources: List[AssistantSource] = Field(default_factory=list)
    structured_data: Optional[StructuredData] = None
    sources: List[Union[AssistantSource, Dict[str, Any]]] = Field(default_factory=list)
    structured_data: Optional[Union[StructuredData, Dict[str, Any]]] = None
    confidence: Optional[float] = None
    time: Optional[str] = None
    created_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssistantSessionCreate(BaseModel):
    """Create session payload."""
    model_config = ConfigDict(extra="allow")

    workspace_id: str
    category_id: Optional[str] = None
    title: Optional[str] = "New Assistant Session"


class AssistantSessionResponse(BaseModel):
    """Session details."""
    model_config = ConfigDict(extra="allow")

    id: str
    workspace_id: str
    category_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime

