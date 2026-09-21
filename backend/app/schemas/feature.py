"""
feature.py
----------
Pydantic schemas for the Product Feature management endpoints.
"""

from __future__ import annotations

from typing import Literal, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


FeaturePriority = Literal["Critical", "High", "Medium", "Low"]
FeatureStatus = Literal["Not Started", "Planned", "In Progress", "Implemented"]


class FeatureFeedbackItem(BaseModel):
    text: str
    date: str = ""
    source: str = ""


class FeatureCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    desc: str = Field(..., min_length=2, max_length=300)
    long_desc: Optional[str] = None
    category: str = "General"
    priority: FeaturePriority = "Medium"
    status: FeatureStatus = "Planned"
    users_impacted: int = 0
    feedback_count: int = 0
    source: str = "Customer Support, App Reviews, Surveys"
    owner: str = "Priya Sharma (PM)"
    dataset_id: Optional[str] = None
    icon_type: str = "card"


class FeatureUpdateRequest(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    long_desc: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[FeaturePriority] = None
    status: Optional[FeatureStatus] = None
    owner: Optional[str] = None
    users_impacted: Optional[int] = None
    feedback_count: Optional[int] = None
    source: Optional[str] = None
    icon_type: Optional[str] = None
    roadmap_status: Optional[str] = None
    prd_linked: Optional[bool] = None


class FeatureResponse(BaseModel):
    id: Optional[str] = None
    feature_id: str
    workspace_id: str
    dataset_id: Optional[str] = None
    product_id: Optional[str] = None
    name: str
    desc: str
    long_desc: str = ""
    category: str
    priority: str
    status: str
    users_impacted: int
    feedback_count: int
    source: str
    owner: str
    icon_type: str = "card"
    created_on: str
    last_updated: str
    evidence_record_ids: list[str] = Field(default_factory=list)
    top_feedback: list[dict[str, Any]] = Field(default_factory=list)
    prd_linked: bool = False
    prd_id: Optional[str] = None
    roadmap_status: Optional[str] = None
    prioritization_score: float = 0.0

    model_config = ConfigDict(extra="ignore")


class FeatureMetricsSummary(BaseModel):
    total_features: int = 56
    active_features: int = 38
    implemented: int = 14
    in_progress: int = 16
    planned: int = 12
    unique_users_impacted: int = 24812
    total_vs_last_month: str = "↑ 12%"
    active_vs_last_month: str = "↑ 8%"
    implemented_vs_last_month: str = "↑ 16%"
    in_progress_vs_last_month: str = "↑ 6%"
    planned_vs_last_month: str = "↓ 7%"
    users_vs_last_month: str = "↑ 14%"
    status_distribution: list[dict[str, Any]] = Field(default_factory=list)
    priority_distribution: list[dict[str, Any]] = Field(default_factory=list)
    trend_history: list[dict[str, Any]] = Field(default_factory=list)


class FeatureListResponse(BaseModel):
    features: list[FeatureResponse]
    metrics: FeatureMetricsSummary
    total_count: int
    page: int = 1
    page_size: int = 10

