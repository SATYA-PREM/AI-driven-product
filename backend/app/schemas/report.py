"""
report.py
---------
Pydantic schemas for Executive Product Intelligence Reports.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SummaryKPIs(BaseModel):
    total_signals_analyzed: int = 0
    total_issue_clusters: int = 0
    total_feature_clusters: int = 0
    critical_issues_count: int = 0
    overall_sentiment_health: str = "attention_required"

    model_config = ConfigDict(extra="ignore")


class ReportResponse(BaseModel):
    report_id: str
    report_type: str = "executive_summary"
    workspace_id: str
    dataset_id: str | None = None
    title: str
    generated_at: str | datetime
    status: str = "COMPLETED"
    summary_kpis: SummaryKPIs = Field(default_factory=SummaryKPIs)
    executive_takeaways: list[str] = Field(default_factory=list)
    prioritized_issues: list[dict[str, Any]] = Field(default_factory=list)
    feature_demand_ranking: list[dict[str, Any]] = Field(default_factory=list)
    emerging_trends: list[dict[str, Any]] = Field(default_factory=list)
    sentiment_overview: dict[str, Any] = Field(default_factory=dict)
    recommended_next_steps: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")

