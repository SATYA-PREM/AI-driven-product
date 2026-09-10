from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional

from app.models.workflow import WorkflowModel
from app.repositories.workflow_repository import workflow_repository
from app.services.workflow.workflow_validator import workflow_validator
from app.services.workflow.workflow_state import workflow_state_machine
from app.core.constants import WorkflowStepStatus, WorkflowStep
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document


class WorkflowService:
    """Service for managing workspace and dataset workflow state progression."""

    @staticmethod
    def create_workflow(workspace_id: str, product_id: str = "", dataset_id: str = "") -> dict:
        """Create a new workflow tracking document."""
        doc = WorkflowModel.create_document(
            workspace_id=workspace_id,
            product_id=product_id,
            dataset_id=dataset_id
        )
        if doc["steps"]:
            doc["steps"][0]["status"] = WorkflowStepStatus.READY.value
        workflow_id = workflow_repository.create(doc)
        doc["_id"] = workflow_id
        return serialize_document(doc)

    @staticmethod
    def get_workflow(workflow_id: str) -> dict:
        """Get workflow by ID."""
        workflow = workflow_repository.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundError("Workflow", workflow_id)
        return serialize_document(workflow)

    @staticmethod
    def get_workspace_workflow(workspace_id: str, dataset_id: Optional[str] = None) -> dict:
        """Get workflow by workspace and dataset, auto-creating initial tracking if absent."""
        workflow = None
        if dataset_id:
            workflow = workflow_repository.find_by_dataset(workspace_id, dataset_id)
        if not workflow:
            workflows = workflow_repository.find_by_workspace(workspace_id)
            if workflows:
                workflow = workflows[0]

        if not workflow:
            workflow = WorkflowService.create_workflow(workspace_id=workspace_id, dataset_id=dataset_id or "")

        return serialize_document(workflow)

    @staticmethod
    def advance_step(workflow_id: str, step_name: str, status: str, metadata: dict = None) -> dict:
        """Advance workflow step."""
        workflow = workflow_repository.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundError("Workflow", workflow_id)

        now = datetime.now(timezone.utc)
        steps = workflow.get("steps", [])
        for step in steps:
            if step.get("name") == step_name:
                step["status"] = status
                if status == WorkflowStepStatus.IN_PROGRESS.value and not step.get("started_at"):
                    step["started_at"] = now
                elif status == WorkflowStepStatus.COMPLETED.value:
                    step["completed_at"] = now
                if metadata:
                    step["metadata"] = metadata

        progress = WorkflowService.calculate_progress(steps)
        workflow["progress_percentage"] = progress
        workflow["updated_at"] = now

        # Advance next step to READY
        if status == WorkflowStepStatus.COMPLETED.value:
            for step in steps:
                if step.get("status") == WorkflowStepStatus.NOT_STARTED.value:
                    step["status"] = WorkflowStepStatus.READY.value
                    workflow["current_step"] = step.get("name")
                    break

        workflow_repository.update(workflow_id, workflow)
        return serialize_document(workflow)

    @staticmethod
    def calculate_progress(steps: list[dict]) -> float:
        """Calculate completion percentage from steps list."""
        if not steps:
            return 0.0
        completed = sum(1 for s in steps if s.get("status") in [WorkflowStepStatus.COMPLETED.value, "completed"])
        return round((completed / len(steps)) * 100.0, 2)


workflow_service = WorkflowService()
