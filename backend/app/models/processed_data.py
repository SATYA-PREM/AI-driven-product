from datetime import datetime, timezone
from typing import Dict, Any, Optional
import uuid
from app.core.constants import SourceType

class ProcessedDataModel:
    """Model for processed data (ProductSignal) collection."""

    @staticmethod
    def create_document(
        dataset_id: str,
        workspace_id: str,
        product_id: str,
        source_type: SourceType,
        source_id: str,
        text: str,
        customer_id: str = "",
        rating: Optional[int] = None,
        date: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        preprocessing_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new processed data document for MongoDB."""
        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "product_id": product_id,
            "signal_id": str(uuid.uuid4()),
            "source_type": source_type,
            "source_id": source_id,
            "customer_id": customer_id,
            "text": text,
            "rating": rating,
            "date": date,
            "metadata": metadata or {},
            "preprocessing_metadata": preprocessing_metadata or {},
            "processed_at": datetime.now(timezone.utc)
        }
