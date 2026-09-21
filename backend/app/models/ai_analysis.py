"""
ai_analysis.py
--------------
MongoDB document models for individual feedback analyses and AI processing jobs.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import uuid

from app.core.constants import AnalysisStatus, AIJobStatus


class AIAnalysisModel:
    """Document model for the `analyses` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        feedback_id: str,
        analysis: dict[str, Any],
        confidence: float,
        model: str = "gemini",
        analysis_version: str = "v1",
        processing_status: str = "completed",
        job_id: str = "",
        original_text: str = "",
        source: str = "Unknown",
        category: str = "General",
    ) -> dict[str, Any]:
        """Create a new feedback analysis MongoDB document with rich top-level dimensions."""
        now = datetime.now(timezone.utc)
        return {
            "analysis_id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "feedback_id": feedback_id,
            "job_id": job_id,
            "original_text": original_text or analysis.get("original_text", ""),
            "source": source or analysis.get("source", "Unknown"),
            "category": category or analysis.get("theme", "General"),
            "sentiment": analysis.get("sentiment", "neutral"),
            "intent": analysis.get("intent", "general_feedback"),
            "urgency_level": analysis.get("urgency_level", "medium"),
            "customer_impact": analysis.get("customer_impact", ""),
            "suggested_action": analysis.get("suggested_action", ""),
            "root_cause_hint": analysis.get("root_cause_hint", ""),
            "source_platform": analysis.get("source_platform", "Unknown"),
            "analysis": analysis,
            "confidence": float(confidence),
            "model": model,
            "analysis_version": analysis_version,
            "processing_status": processing_status,
            "created_at": now,
            "updated_at": now,
        }


class AIJobModel:
    """Document model for the `ai_jobs` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        dataset_id: str,
        analysis_version: str = "v1",
        job_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a new AI job MongoDB document."""
        now = datetime.now(timezone.utc)
        return {
            "job_id": job_id or f"JOB-{uuid.uuid4().hex[:8].upper()}",
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "status": AIJobStatus.QUEUED.value,
            "current_agent": None,
            "agents": {
                "feedback_analysis": "pending",
                "pattern_trend": "pending",
                "product_intelligence": "pending",
            },
            "step_progress": {
                "total_records": 0,
                "processed_records": 0,
                "issue_clusters_count": 0,
                "feature_clusters_count": 0,
                "insights_count": 0,
            },
            "stage_outputs": {
                "stage_1": {},
                "stage_2": {},
                "stage_3": {},
            },
            "summary": {},
            "analysis_version": analysis_version,
            "error": None,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        }
