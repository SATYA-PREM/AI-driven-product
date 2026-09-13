"""
workflow_service.py
-------------------
Business operations for the product intelligence workflow:
- Single entry point to inspect pipeline progression
- Stage dependency evaluation
- Progress calculation for UI dashboards
"""

from __future__ import annotations
from typing import Any

from app.core.logging import get_logger
from app.workflow.states import WorkflowState
from app.workflow.transitions import (
    can_transition,
    require_dataset_stage,
    get_pipeline_progress,
    MASTER_PIPELINE_SEQUENCE,
)
from app.repositories.dataset_repository import dataset_repository
from app.repositories.analysis_repository import ai_job_repository

logger = get_logger(__name__)


class WorkflowService:
    """Unified service for querying and controlling dataset workflow lifecycle."""

    def get_dataset_workflow_status(self, dataset_id: str) -> dict[str, Any]:
        """Get current workflow state and step-by-step progress for a dataset."""
        dataset = dataset_repository.find_by_id(dataset_id)
        if not dataset:
            return {
                "dataset_id": dataset_id,
                "status": WorkflowState.CREATED.value,
                "progress": get_pipeline_progress(WorkflowState.CREATED),
            }

        raw_status = dataset.get("status", WorkflowState.CREATED.value)
        current_state = WorkflowState.normalize(raw_status)
        latest_job = ai_job_repository.get_latest_job_for_dataset(dataset_id) if hasattr(ai_job_repository, "get_latest_job_for_dataset") else None

        return {
            "dataset_id": dataset_id,
            "workspace_id": dataset.get("workspace_id", ""),
            "status": current_state.value,
            "progress": get_pipeline_progress(current_state),
            "latest_job": latest_job,
        }

    def validate_dataset_stage(
        self,
        dataset_id: str,
        required_states: WorkflowState | list[WorkflowState],
        operation_name: str,
    ) -> dict[str, Any]:
        """Helper to find dataset and enforce stage gating in a single call."""
        dataset = dataset_repository.find_by_id(dataset_id)
        if not dataset:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Dataset", dataset_id)

        require_dataset_stage(dataset, required_states, operation_name)
        return dataset


workflow_service = WorkflowService()

