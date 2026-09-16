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

    def replace_raw_records(self, dataset_id: str, records: list[dict]) -> int:
        """Atomically replace raw records for a dataset."""
        if dataset_id:
            raw_data_collection.delete_many({"dataset_id": dataset_id})
        return self.insert_raw_records(records)

    def get_raw_records(self, dataset_id: str, skip: int = 0, limit: int | None = None) -> list[dict]:
        """Get raw records for a dataset. If limit is None or <= 0, returns all records."""
        cursor = raw_data_collection.find({"dataset_id": dataset_id}).skip(skip)
        if limit is not None and limit > 0:
            cursor = cursor.limit(limit)
        return list(cursor)

    def count_raw_records(self, dataset_id: str) -> int:
        """Count raw records for a dataset."""
        return raw_data_collection.count_documents({"dataset_id": dataset_id})

    def delete_raw_records(self, dataset_id: str) -> int:
        """Delete raw records for a dataset."""
        result = raw_data_collection.delete_many({"dataset_id": dataset_id})
        return result.deleted_count

    def insert_cleaned_records(self, records: list[dict]) -> int:
        """Insert multiple cleaned records."""
        if not records:
            return 0
        result = cleaned_data_collection.insert_many(records)
        return len(result.inserted_ids)

    def replace_cleaned_records(self, dataset_id: str, records: list[dict]) -> int:
        """Atomically replace cleaned records for a dataset."""
        if dataset_id:
            cleaned_data_collection.delete_many({"dataset_id": dataset_id})
        return self.insert_cleaned_records(records)

    def get_cleaned_records(self, dataset_id: str, skip: int = 0, limit: int | None = None) -> list[dict]:
        """Get cleaned records for a dataset. If limit is None or <= 0, returns all records."""
        cursor = cleaned_data_collection.find({"dataset_id": dataset_id}).skip(skip)
        if limit is not None and limit > 0:
            cursor = cursor.limit(limit)
        return list(cursor)

    def count_cleaned_records(self, dataset_id: str) -> int:
        """Count cleaned records for a dataset."""
        return cleaned_data_collection.count_documents({"dataset_id": dataset_id})

    def delete_cleaned_records(self, dataset_id: str) -> int:
        """Delete cleaned records for a dataset."""
        result = cleaned_data_collection.delete_many({"dataset_id": dataset_id})
        return result.deleted_count

    def insert_processed_records(self, records: list[dict]) -> int:
        """Insert multiple processed records."""
        if not records:
            return 0
        result = processed_data_collection.insert_many(records)
        return len(result.inserted_ids)

    def replace_processed_records(self, dataset_id: str, records: list[dict]) -> int:
        """Atomically replace processed records for a dataset."""
        if dataset_id:
            processed_data_collection.delete_many({"dataset_id": dataset_id})
        return self.insert_processed_records(records)

    def get_processed_records(self, dataset_id: str, skip: int = 0, limit: int | None = None) -> list[dict]:
        """Get processed records for a dataset. If limit is None or <= 0, returns all records."""
        cursor = processed_data_collection.find({"dataset_id": dataset_id}).skip(skip)
        if limit is not None and limit > 0:
            cursor = cursor.limit(limit)
        return list(cursor)

    def count_processed_records(self, dataset_id: str) -> int:
        """Count processed records for a dataset."""
        return processed_data_collection.count_documents({"dataset_id": dataset_id})

    def delete_processed_records(self, dataset_id: str) -> int:
        """Delete processed records for a dataset."""
        result = processed_data_collection.delete_many({"dataset_id": dataset_id})
        return result.deleted_count


data_repository = DataRepository()
