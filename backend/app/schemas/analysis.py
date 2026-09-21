"""
analysis.py
-----------
Pydantic schemas for Agent 1 (Feedback Analysis Agent) outputs,
analysis API requests, and responses.
"""

from __future__ import annotations

from typing import Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.core.constants import SentimentType, IntentType, AnalysisStatus


class FeedbackAnalysisOutput(BaseModel):
    """
    Validated 10-dimension structured output produced by Agent 1 (Feedback Analysis Agent)
    via Gemini semantic interpretation.
    """
    feedback_id: str = Field(description="Unique ID of the customer feedback record")
    sentiment: Literal["positive", "negative", "neutral", "mixed"] = Field(
        description="Emotional or product sentiment"
    )
    sentiment_confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score for sentiment analysis (0.0 to 1.0)"
    )
    intent: Literal[
        "complaint",
        "bug_report",
        "feature_request",
        "question",
        "praise",
        "general_feedback"
    ] = Field(description="Customer submission intent")
    intent_confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score for intent classification (0.0 to 1.0)"
    )
    theme: str = Field(description="High-level product theme (e.g. checkout, reporting, auth)")
    theme_confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score for theme classification (0.0 to 1.0)"
    )
    product_area: str = Field(
        description="Specific feature or sub-module (e.g. payment_confirmation, report_export)"
    )
    pain_points: list[str] = Field(
        default_factory=list, description="Customer difficulties and friction points"
    )
    issues: list[str] = Field(
        default_factory=list, description="Concrete product problems, errors, or bugs"
    )
    feature_requests: list[str] = Field(
        default_factory=list, description="Requested new or improved capabilities"
    )
    keywords: list[str] = Field(
        default_factory=list, description="Meaningful analytical terms for search and filtering"
    )
    urgency_level: Literal["critical", "high", "medium", "low"] = Field(
        default="medium", description="Urgency / severity of the friction point"
    )
    customer_impact: str = Field(
        default="", description="Qualitative and operational impact on user experience"
    )
    suggested_action: str = Field(
        default="", description="Recommended engineering, UX, or product remediation"
    )
    root_cause_hint: str = Field(
        default="", description="Diagnostic hypothesis explaining why the customer experienced this issue"
    )
    source_platform: str = Field(
        default="Unknown", description="Operating system, device, or channel platform"
    )
    overall_confidence: float = Field(
        ge=0.0, le=1.0, description="Aggregate confidence score for the record analysis (0.0 to 1.0)"
    )

    model_config = ConfigDict(extra="ignore")


class AnalysisStartRequest(BaseModel):
    """Request payload to initiate AI analysis on a dataset."""
    analysis_version: str = "v1"
    batch_size: int = 25
    force_rerun: bool = False

    model_config = ConfigDict(extra="ignore")


class AnalysisRecordResponse(BaseModel):
    """API response model for an individual feedback analysis."""
    id: str | None = None
    workspace_id: str
    dataset_id: str
    feedback_id: str
    analysis: FeedbackAnalysisOutput
    confidence: float
    model: str = "gemini"
    analysis_version: str = "v1"
    processing_status: str = "completed"
    created_at: datetime | str | None = None

    model_config = ConfigDict(extra="ignore")


class AnalysisBatchResponse(BaseModel):
    """Summary of batch feedback analysis execution."""
    dataset_id: str
    workspace_id: str
    total_records: int
    analyzed_count: int
    failed_count: int
    low_confidence_count: int
    analysis_version: str = "v1"
    status: str

    model_config = ConfigDict(extra="ignore")

