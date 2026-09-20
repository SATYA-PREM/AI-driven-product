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


from app.core.logging import get_logger

logger = get_logger(__name__)


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
                workflow = workflow_repository.find_one({"dataset_id": dataset_id})
            if not workflow:
                workflow = WorkflowService.create_workflow(workspace_id=workspace_id, dataset_id=dataset_id)
        elif workspace_id:
            workflows = workflow_repository.find_by_workspace(workspace_id)
            if workflows:
                workflow = workflows[0]

        if not workflow:
            workflow = WorkflowService.create_workflow(workspace_id=workspace_id, dataset_id=dataset_id or "")

        target_dataset_id = dataset_id or workflow.get("dataset_id")
        if target_dataset_id:
            try:
                from app.repositories.dataset_repository import dataset_repository
                dataset = dataset_repository.find_by_id(target_dataset_id)
                if dataset:
                    d_status = str(dataset.get("status", "")).lower()
                    steps = workflow.get("steps", [])
                    now = datetime.now(timezone.utc)

                    if d_status in ["completed", "intelligence_ready"]:
                        for s in steps:
                            s["status"] = WorkflowStepStatus.COMPLETED.value
                            if not s.get("completed_at"):
                                s["completed_at"] = now
                        workflow["current_step"] = "report"
                        workflow["overall_status"] = "completed"
                        workflow["progress_percentage"] = 100.0
                    elif d_status in ["preprocessed", "ready"]:
                        target_names = ["auth", "workspace", "product", "upload", "ingestion", "validation", "cleaning", "normalization", "preprocessing"]
                        for s in steps:
                            if s.get("name") in target_names:
                                s["status"] = WorkflowStepStatus.COMPLETED.value
                                if not s.get("completed_at"):
                                    s["completed_at"] = now
                            elif s.get("name") == "ai_analysis" and s.get("status") in [WorkflowStepStatus.NOT_STARTED.value, "not_started"]:
                                s["status"] = WorkflowStepStatus.READY.value
                        if workflow.get("overall_status") != "completed":
                            workflow["current_step"] = "ai_analysis"
                            workflow["overall_status"] = "in_progress"
                        workflow["progress_percentage"] = WorkflowService.calculate_progress(steps)
                    elif d_status == "cleaned":
                        target_names = ["auth", "workspace", "product", "upload", "ingestion", "validation", "cleaning", "normalization"]
                        for s in steps:
                            if s.get("name") in target_names:
                                s["status"] = WorkflowStepStatus.COMPLETED.value
                                if not s.get("completed_at"):
                                    s["completed_at"] = now
                            elif s.get("name") == "preprocessing" and s.get("status") in [WorkflowStepStatus.NOT_STARTED.value, "not_started"]:
                                s["status"] = WorkflowStepStatus.READY.value
                        if workflow.get("overall_status") != "completed":
                            workflow["current_step"] = "preprocessing"
                            workflow["overall_status"] = "in_progress"
                        workflow["progress_percentage"] = WorkflowService.calculate_progress(steps)
                    elif d_status == "validated":
                        target_names = ["auth", "workspace", "product", "upload", "ingestion", "validation"]
                        for s in steps:
                            if s.get("name") in target_names:
                                s["status"] = WorkflowStepStatus.COMPLETED.value
                                if not s.get("completed_at"):
                                    s["completed_at"] = now
                            elif s.get("name") == "cleaning" and s.get("status") in [WorkflowStepStatus.NOT_STARTED.value, "not_started"]:
                                s["status"] = WorkflowStepStatus.READY.value
                        if workflow.get("overall_status") != "completed":
                            workflow["current_step"] = "cleaning"
                            workflow["overall_status"] = "in_progress"
                        workflow["progress_percentage"] = WorkflowService.calculate_progress(steps)
                    elif d_status in ["uploaded", "ingested"]:
                        target_names = ["auth", "workspace", "product", "upload", "ingestion"]
                        for s in steps:
                            if s.get("name") in target_names:
                                s["status"] = WorkflowStepStatus.COMPLETED.value
                                if not s.get("completed_at"):
                                    s["completed_at"] = now
                            elif s.get("name") == "validation" and s.get("status") in [WorkflowStepStatus.NOT_STARTED.value, "not_started"]:
                                s["status"] = WorkflowStepStatus.READY.value
                        if workflow.get("overall_status") != "completed":
                            workflow["current_step"] = "validation"
                            workflow["overall_status"] = "in_progress"
                        workflow["progress_percentage"] = WorkflowService.calculate_progress(steps)

                    wf_id = str(workflow.get("_id") or workflow.get("id"))
                    if wf_id:
                        workflow_repository.update(wf_id, workflow)
            except Exception as e:
                logger.warning(f"Workflow reconciliation error: {e}")

        return serialize_document(workflow)

    @staticmethod
    def advance_step(workflow_id: str, step_name: str, status: str, metadata: dict = None) -> dict:
        """Advance workflow step."""
        workflow = workflow_repository.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundError("Workflow", workflow_id)

        now = datetime.now(timezone.utc)
        steps = workflow.get("steps", [])
        found = False
        for step in steps:
            if step.get("name") == step_name:
                found = True
                step["status"] = status
                if status == WorkflowStepStatus.IN_PROGRESS.value and not step.get("started_at"):
                    step["started_at"] = now
                elif status in [WorkflowStepStatus.COMPLETED.value, "completed"]:
                    if not step.get("started_at"):
                        step["started_at"] = now
                    step["completed_at"] = now
                if metadata:
                    step.setdefault("metadata", {}).update(metadata)
                break

        if not found:
            steps.append({
                "name": step_name,
                "status": status,
                "started_at": now,
                "completed_at": now if status in [WorkflowStepStatus.COMPLETED.value, "completed"] else None,
                "metadata": metadata or {},
            })

        # Advance next step to READY and auto-complete prerequisites if executing downstream
        if status in [WorkflowStepStatus.COMPLETED.value, "completed"]:
            step_idx = -1
            for i, s in enumerate(steps):
                if s.get("name") == step_name:
                    step_idx = i
                    break

            if step_idx >= 0:
                for j in range(step_idx):
                    if steps[j].get("status") not in [WorkflowStepStatus.COMPLETED.value, "completed"]:
                        steps[j]["status"] = WorkflowStepStatus.COMPLETED.value
                        if not steps[j].get("completed_at"):
                            steps[j]["completed_at"] = now

            next_step_name = None
            start_search = step_idx + 1 if step_idx >= 0 else 0
            for j in range(start_search, len(steps)):
                if steps[j].get("status") not in [WorkflowStepStatus.COMPLETED.value, "completed"]:
                    if steps[j].get("status") == WorkflowStepStatus.NOT_STARTED.value:
                        steps[j]["status"] = WorkflowStepStatus.READY.value
                    next_step_name = steps[j].get("name")
                    break

            workflow["current_step"] = next_step_name or step_name
        else:
            workflow["current_step"] = step_name

        progress = WorkflowService.calculate_progress(steps)
        workflow["progress_percentage"] = progress
        workflow["updated_at"] = now

        if status in [WorkflowStepStatus.FAILED.value, "failed"]:
            workflow["overall_status"] = "failed"
        elif progress >= 100.0:
            workflow["overall_status"] = "completed"
        else:
            workflow["overall_status"] = "in_progress"

        workflow_repository.update(workflow_id, workflow)
        return serialize_document(workflow)

    @staticmethod
    def sync_dataset_workflow_step(
        workspace_id: str,
        dataset_id: str,
        step_name: str | WorkflowStep,
        status: str | WorkflowStepStatus,
        metadata: dict | None = None,
    ) -> dict | None:
        """
        Synchronously advance the workflow step for a dataset, creating tracking if absent.
        Guarantees that workflows_collection is updated after each execution milestone.
        """
        try:
            step_str = step_name.value if hasattr(step_name, "value") else str(step_name)
            status_str = status.value if hasattr(status, "value") else str(status)

            workflow = None
            if dataset_id:
                workflow = workflow_repository.find_by_dataset(workspace_id, dataset_id)
                if not workflow:
                    workflow = workflow_repository.find_one({"dataset_id": dataset_id})
                if not workflow:
                    created = WorkflowService.create_workflow(
                        workspace_id=workspace_id or "",
                        dataset_id=dataset_id or ""
                    )
                    workflow_id = created.get("_id") or created.get("id")
                else:
                    workflow_id = str(workflow.get("_id") or workflow.get("id"))
            elif workspace_id:
                workflows = workflow_repository.find_by_workspace(workspace_id)
                if workflows:
                    workflow = workflows[0]
                    workflow_id = str(workflow.get("_id") or workflow.get("id"))
                else:
                    created = WorkflowService.create_workflow(
                        workspace_id=workspace_id or "",
                        dataset_id=""
                    )
                    workflow_id = created.get("_id") or created.get("id")
            else:
                return None

            if not workflow_id:
                return None

            return WorkflowService.advance_step(
                workflow_id=workflow_id,
                step_name=step_str,
                status=status_str,
                metadata=metadata,
            )
        except Exception as e:
            logger.warning(f"Failed to sync workflow step '{step_name}': {e}")
            return None

    @staticmethod
    def calculate_progress(steps: list[dict]) -> float:
        """Calculate completion percentage from steps list."""
        if not steps:
            return 0.0
        completed = sum(1 for s in steps if s.get("status") in [WorkflowStepStatus.COMPLETED.value, "completed"])
        return round((completed / len(steps)) * 100.0, 2)


workflow_service = WorkflowService()
