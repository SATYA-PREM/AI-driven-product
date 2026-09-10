from datetime import datetime, timezone
from typing import Dict, Any, Optional

class CleanedDataModel:
    """Model for cleaned data collection."""

    @staticmethod
    def create_document(
        dataset_id: str,
        workspace_id: str,
        product_id: str,
        source_record_id: str,
        row_number: int,
        cleaned_record: Dict[str, Any],
        cleaning_metadata: Optional[Dict[str, Any]] = None,
        is_duplicate: bool = False,
        duplicate_group: str = ""
    ) -> Dict[str, Any]:
        """Create a new cleaned data document for MongoDB."""
        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "product_id": product_id,
            "source_record_id": source_record_id,
            "row_number": row_number,
            "cleaned_record": cleaned_record,
            "cleaning_metadata": cleaning_metadata or {},
            "is_duplicate": is_duplicate,
            "duplicate_group": duplicate_group,
            "cleaned_at": datetime.now(timezone.utc)
        }
