from bson import ObjectId
from app.repositories.base_repository import BaseRepository
from app.core.database import datasets_collection

class DatasetRepository(BaseRepository):
    """Repository for dataset-related MongoDB operations."""

    def __init__(self):
        super().__init__(datasets_collection)

    def get_by_id(self, dataset_id: str) -> dict | None:
        """Find dataset by id (alias for find_by_id)."""
        return self.find_by_id(dataset_id)
    def find_by_id(self, dataset_id: str) -> dict | None:
        """Find dataset by id, checking both ObjectId and string dataset_id."""
        if not dataset_id:
            return None
        if ObjectId.is_valid(dataset_id):
            doc = self.collection.find_one({"_id": ObjectId(dataset_id)})
            if doc:
                return doc
        return self.collection.find_one({"$or": [{"_id": dataset_id}, {"dataset_id": dataset_id}]})

    get_by_id = find_by_id

    def find_by_workspace(self, workspace_id: str, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all datasets in a workspace."""
        return self.find_many({"workspace_id": workspace_id}, skip=skip, limit=limit)

    def find_by_product(self, product_id: str, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all datasets associated with a product."""
        return self.find_many({"product_id": product_id}, skip=skip, limit=limit)

    def update_status(self, dataset_id: str, status: str, extra_fields: dict = None) -> bool:
        """Update the status of a dataset, matching either ObjectId or string dataset_id."""
        if not dataset_id:
            return False
        update_data = {}
        if status:
            update_data["status"] = status
        if extra_fields:
            update_data.update(extra_fields)
        return self.update(dataset_id, update_data)

    def update_record_count(self, dataset_id: str, count: int) -> bool:
        """Update the total record count of a dataset."""
        return self.update(dataset_id, {"record_count": count})

dataset_repository = DatasetRepository()
