"""
MongoDB Document Model for Customer Feedback.
Tracks raw feedback, sentiment, source, status, assignments, AI extracted issues, and feature links.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CustomerFeedbackModel(BaseModel):
    workspace_id: str
    feedback_id: str  # e.g., 'FB-001'
    dataset_id: Optional[str] = None
    text: str
    source: str = "App Store"  # App Store, Play Store, Support, Survey, Social Media, Manual
    sentiment: str = "Neutral"  # Positive, Neutral, Negative
    sentiment_score: float = 0.0  # -1.0 to 1.0
    category: str = "General"  # Checkout & Payments, Performance & Speed, UI/UX, Product Features, Pricing, Account & Login, Others
    priority: str = "Medium"  # Critical, High, Medium, Low
    status: str = "New"  # New, In Review, Resolved, Snoozed
    assigned_to: str = "Unassigned"
    user_id: Optional[str] = None
    device: Optional[str] = None  # Android, iOS, Web
    app_version: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    date_str: str = ""  # formatted date string, e.g. "Jul 31, 2025"
    key_issues: List[str] = Field(default_factory=list)
    suggested_feature: Optional[str] = None
    mapped_feature_id: Optional[str] = None
    mapped_feature_name: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    resolution_date: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

