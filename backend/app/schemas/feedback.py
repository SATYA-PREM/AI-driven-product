"""
Pydantic schemas for Customer Feedback requests, responses, and metrics.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FeedbackItemResponse(BaseModel):
    feedback_id: str
    workspace_id: str
    dataset_id: Optional[str] = None
    text: str
    source: str
    sentiment: str
    sentiment_score: float = 0.0
    category: str
    priority: str
    status: str
    assigned_to: str = "Unassigned"
    user_id: Optional[str] = None
    device: Optional[str] = None
    app_version: Optional[str] = None
    date_str: str = ""
    key_issues: List[str] = Field(default_factory=list)
    suggested_feature: Optional[str] = None
    mapped_feature_id: Optional[str] = None
    mapped_feature_name: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    resolution_date: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FeedbackCreateRequest(BaseModel):
    text: str
    source: str = "Manual"
    sentiment: Optional[str] = "Neutral"
    category: str = "General"
    priority: Optional[str] = "Medium"
    status: Optional[str] = "New"
    user_id: Optional[str] = None
    device: Optional[str] = None
    app_version: Optional[str] = None
    assigned_to: Optional[str] = "Unassigned"


class FeedbackUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    category: Optional[str] = None
    sentiment: Optional[str] = None
    resolution_date: Optional[str] = None


class FeedbackMapFeatureRequest(BaseModel):
    feature_id: Optional[str] = None
    feature_name: Optional[str] = None
    create_if_missing: bool = True


class FeedbackMetricsResponse(BaseModel):
    total_feedback: int = 0
    new_this_week: int = 0
    positive_count: int = 0
    positive_pct: float = 0.0
    neutral_count: int = 0
    neutral_pct: float = 0.0
    negative_count: int = 0
    negative_pct: float = 0.0
    unresolved_count: int = 0
    resolved_count: int = 0
    mapped_count: int = 0
    unmapped_count: int = 0
    trend: List[Dict[str, Any]] = Field(default_factory=list)
    source_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    top_themes: List[Dict[str, Any]] = Field(default_factory=list)


class FeedbackListResponse(BaseModel):
    feedback: List[FeedbackItemResponse]
    total: int
    metrics: FeedbackMetricsResponse

