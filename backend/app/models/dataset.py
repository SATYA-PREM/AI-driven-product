from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.constants import DatasetStatus, FileFormat, SourceType

class DatasetModel:
    """Model for dataset collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        product_id: str,
        filename: str,
        format: FileFormat,
        source_type: SourceType,
        file_size: int,
        uploaded_by: str,
        record_count: int = 0,
        status: DatasetStatus = DatasetStatus.UPLOADING,
        processing_metadata: Optional[Dict[str, Any]] = None,
        dataset_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new dataset document for MongoDB."""
        val_name = dataset_name or filename
        return {
            "workspace_id": workspace_id,
            "product_id": product_id,
            "filename": filename,
            "dataset_name": val_name,
            "name": val_name,
            "format": format,
            "source_type": source_type,
            "file_size": file_size,
            "record_count": record_count,
            "status": status,
            "uploaded_by": uploaded_by,
            "created_at": datetime.now(timezone.utc),
            "processing_metadata": processing_metadata or {}
        }
