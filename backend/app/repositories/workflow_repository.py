from datetime import datetime, timezone
from app.repositories.base_repository import BaseRepository
from app.core.database import workflows_collection
from bson import ObjectId

class WorkflowRepository(BaseRepository):
    """Repository for workflow-related operations."""

    def __init__(self):
        super().__init__(workflows_collection)

    def find_by_workspace(self, workspace_id: str) -> list[dict]:
        """Find all workflows in a workspace."""
        return self.find_many({"workspace_id": workspace_id})

    def find_by_dataset(self, workspace_id: str, dataset_id: str) -> dict | None:
        """Find a workflow associated with a specific dataset in a workspace."""
        return self.find_one({"workspace_id": workspace_id, "dataset_id": dataset_id})

    def update_step_status(self, workflow_id: str, step_name: str, status: str, metadata: dict = None) -> bool:
        """Update the status of a specific step in the workflow."""
        if not ObjectId.is_valid(workflow_id):
            return False

        if metadata is None:
            metadata = {}

        result = self.collection.update_one(
            {
                "_id": ObjectId(workflow_id),
                "steps.name": step_name
            },
            {
                "$set": {
                    "steps.$.status": status,
                    "steps.$.metadata": metadata,
                    "steps.$.updated_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count > 0

    def update_current_step(self, workflow_id: str, step_name: str, progress: float) -> bool:
        """Update the current step and its progress in the workflow."""
        update_data = {
            "current_step": step_name,
            "progress": progress,
            "updated_at": datetime.now(timezone.utc)
        }
        return self.update(workflow_id, update_data)

workflow_repository = WorkflowRepository()
