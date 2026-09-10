from typing import Any
from app.core.database import validation_results_collection

class ValidationRepository:
    """Repository for validation results operations."""

    def save_results(self, result_doc: dict) -> str:
        """Save or update validation results for a dataset."""
        dataset_id = result_doc.get("dataset_id")
        result = validation_results_collection.update_one(
            {"dataset_id": dataset_id},
            {"$set": result_doc},
            upsert=True
        )
        if result.upserted_id:
            return str(result.upserted_id)
        existing = self.get_by_dataset(dataset_id)
        return str(existing["_id"]) if existing else ""

    def get_by_dataset(self, dataset_id: str) -> dict | None:
        """Get full validation results for a dataset."""
        return validation_results_collection.find_one({"dataset_id": dataset_id})

    def get_summary(self, dataset_id: str) -> dict | None:
        """Get just the summary fields of validation results (no record_results)."""
        return validation_results_collection.find_one(
            {"dataset_id": dataset_id},
            {"record_results": 0}
        )

validation_repository = ValidationRepository()
