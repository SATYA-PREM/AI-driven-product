from datetime import datetime, timezone
from typing import Dict, Any, List
from app.core.constants import WorkflowStep, WorkflowStepStatus

class WorkflowModel:
    """Model for workflow collection."""

    @staticmethod
    def create_initial_steps() -> List[Dict[str, Any]]:
        """Build the steps list from the WorkflowStep enum."""
        steps = []
        for step in WorkflowStep:
            steps.append({
                "name": step.value if hasattr(step, "value") else str(step),
                "status": WorkflowStepStatus.NOT_STARTED,
                "started_at": None,
                "completed_at": None,
                "metadata": {}
            })
        return steps

    @staticmethod
    def create_document(
        workspace_id: str,
        product_id: str = "",
        dataset_id: str = "",
        current_step: WorkflowStep = WorkflowStep.AUTH,
        overall_status: str = "not_started",
        progress_percentage: float = 0.0
    ) -> Dict[str, Any]:
        """Create a new workflow document for MongoDB."""
        now = datetime.now(timezone.utc)
        return {
            "workspace_id": workspace_id,
            "product_id": product_id,
            "dataset_id": dataset_id,
            "steps": WorkflowModel.create_initial_steps(),
            "current_step": current_step,
            "overall_status": overall_status,
            "progress_percentage": progress_percentage,
            "created_at": now,
            "updated_at": now
        }
