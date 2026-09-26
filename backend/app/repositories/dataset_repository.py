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

    def delete_cascade(self, dataset_id: str) -> dict[str, int]:
        """
        Cascading delete: Removes the dataset document and ALL linked data
        (raw data, cleaned data, processed signals, validations, jobs, workflows,
        AI analyses, clusters, features, insights, patterns, trends, reports)
        belonging to this specific dataset_id across the whole MongoDB database.
        """
        if not dataset_id:
            return {}

        ds_id_str = str(dataset_id)
        queries = [{"dataset_id": ds_id_str}]
        if ObjectId.is_valid(ds_id_str):
            queries.append({"dataset_id": ObjectId(ds_id_str)})

        linked_filter = {"$or": queries} if len(queries) > 1 else queries[0]

        from app.core.database import db_manager
        db = db_manager.db
        deleted_summary: dict[str, int] = {}

        # Protected core system collections that should never be deleted by dataset_id query
        protected_collections = {"users", "workspaces", "workspace_members", "products"}

        for col_name in db.list_collection_names():
            if col_name in protected_collections or col_name == "datasets":
                continue
            try:
                col = db[col_name]
                res = col.delete_many(linked_filter)
                if res.deleted_count > 0:
                    deleted_summary[col_name] = res.deleted_count
            except Exception:
                pass

        # Delete the dataset document itself from datasets collection
        ds_queries = [{"_id": ds_id_str}, {"id": ds_id_str}, {"dataset_id": ds_id_str}]
        if ObjectId.is_valid(ds_id_str):
            ds_queries.append({"_id": ObjectId(ds_id_str)})

        ds_res = self.collection.delete_many({"$or": ds_queries})
        deleted_summary["datasets"] = ds_res.deleted_count

        return deleted_summary

    def delete(self, dataset_id: str) -> bool:
        """
        Delete a dataset and all its linked records across all collections.
        """
        summary = self.delete_cascade(dataset_id)
        return summary.get("datasets", 0) > 0

dataset_repository = DatasetRepository()
