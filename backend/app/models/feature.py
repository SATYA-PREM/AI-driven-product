"""
feature.py
----------
MongoDB document model for the `product_features` collection.
Supports lifecycle stages: Not Started, Planned, In Progress, Implemented.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import uuid


class ProductFeatureModel:
    """Document model for the `product_features` collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        name: str,
        desc: str,
        category: str = "General",
        priority: str = "Medium",
        status: str = "Planned",
        users_impacted: int = 0,
        feedback_count: int = 0,
        source: str = "Customer Support, App Reviews, Surveys",
        owner: str = "Priya Sharma (PM)",
        dataset_id: str | None = None,
        product_id: str | None = None,
        long_desc: str = "",
        icon_type: str = "card",
        created_on: str | None = None,
        last_updated: str | None = None,
        evidence_record_ids: list[str] | None = None,
        top_feedback: list[dict[str, str]] | None = None,
        prd_linked: bool = False,
        prd_id: str | None = None,
        roadmap_status: str | None = None,
        prioritization_score: float = 0.0,
        feature_id: str | None = None,
    ) -> dict[str, Any]:
        fid = feature_id or f"feat-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)
        now_str = now.strftime("%b %d, %Y")

        return {
            "feature_id": fid,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "product_id": product_id,
            "name": name,
            "desc": desc,
            "long_desc": long_desc or desc,
            "category": category,
            "priority": priority,  # Critical, High, Medium, Low
            "status": status,      # Not Started, Planned, In Progress, Implemented
            "users_impacted": int(users_impacted),
            "feedback_count": int(feedback_count),
            "source": source,
            "owner": owner,
            "icon_type": icon_type,
            "created_on": created_on or now_str,
            "last_updated": last_updated or now_str,
            "evidence_record_ids": evidence_record_ids or [],
            "top_feedback": top_feedback or [],
            "prd_linked": bool(prd_linked),
            "prd_id": prd_id,
            "roadmap_status": roadmap_status or ("Planned" if status == "Planned" else "Not Scheduled"),
            "prioritization_score": float(prioritization_score),
            "created_at": now,
            "updated_at": now,
        }

