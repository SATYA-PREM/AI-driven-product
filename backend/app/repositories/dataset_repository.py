from app.repositories.base_repository import BaseRepository
from app.core.database import datasets_collection

class DatasetRepository(BaseRepository):
    """Repository for dataset-related MongoDB operations."""

    def __init__(self):
        super().__init__(datasets_collection)

    def find_by_workspace(self, workspace_id: str, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all datasets in a workspace."""
        return self.find_many({"workspace_id": workspace_id}, skip=skip, limit=limit)

    def find_by_product(self, product_id: str, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all datasets associated with a product."""
        return self.find_many({"product_id": product_id}, skip=skip, limit=limit)

    def update_status(self, dataset_id: str, status: str, extra_fields: dict = None) -> bool:
        """Update the status of a dataset."""
        update_data = {"status": status}
        if extra_fields:
            update_data.update(extra_fields)
        return self.update(dataset_id, update_data)

    def update_record_count(self, dataset_id: str, count: int) -> bool:
        """Update the total record count of a dataset."""
        return self.update(dataset_id, {"record_count": count})

dataset_repository = DatasetRepository()
