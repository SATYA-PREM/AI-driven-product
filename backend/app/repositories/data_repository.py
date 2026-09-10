from typing import Any
from app.core.database import raw_data_collection, cleaned_data_collection, processed_data_collection

class DataRepository:
    """Repository for handling raw, cleaned, and processed data records."""

    def insert_raw_records(self, records: list[dict]) -> int:
        """Insert multiple raw records."""
        if not records:
            return 0
        result = raw_data_collection.insert_many(records)
        return len(result.inserted_ids)

    def get_raw_records(self, dataset_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get raw records for a dataset."""
        return list(raw_data_collection.find({"dataset_id": dataset_id}).skip(skip).limit(limit))

    def count_raw_records(self, dataset_id: str) -> int:
        """Count raw records for a dataset."""
        return raw_data_collection.count_documents({"dataset_id": dataset_id})

    def insert_cleaned_records(self, records: list[dict]) -> int:
        """Insert multiple cleaned records."""
        if not records:
            return 0
        result = cleaned_data_collection.insert_many(records)
        return len(result.inserted_ids)

    def get_cleaned_records(self, dataset_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get cleaned records for a dataset."""
        return list(cleaned_data_collection.find({"dataset_id": dataset_id}).skip(skip).limit(limit))

    def count_cleaned_records(self, dataset_id: str) -> int:
        """Count cleaned records for a dataset."""
        return cleaned_data_collection.count_documents({"dataset_id": dataset_id})

    def insert_processed_records(self, records: list[dict]) -> int:
        """Insert multiple processed records."""
        if not records:
            return 0
        result = processed_data_collection.insert_many(records)
        return len(result.inserted_ids)

    def get_processed_records(self, dataset_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get processed records for a dataset."""
        return list(processed_data_collection.find({"dataset_id": dataset_id}).skip(skip).limit(limit))

    def count_processed_records(self, dataset_id: str) -> int:
        """Count processed records for a dataset."""
        return processed_data_collection.count_documents({"dataset_id": dataset_id})

data_repository = DataRepository()
