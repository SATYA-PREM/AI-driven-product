from datetime import datetime, timezone
from typing import Dict, Any
from app.core.constants import SourceType

class RawDataModel:
    """Model for raw data collection."""

    @staticmethod
    def create_document(
        dataset_id: str,
        workspace_id: str,
        product_id: str,
        source_type: SourceType,
        row_number: int,
        original_record: Dict[str, Any],
        source_record_id: str = ""
    ) -> Dict[str, Any]:
        """Create a new raw data document for MongoDB."""
        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "product_id": product_id,
            "source_type": source_type,
            "source_record_id": source_record_id,
            "row_number": row_number,
            "original_record": original_record,
            "created_at": datetime.now(timezone.utc)
        }
