from datetime import datetime, timezone
from typing import Dict, Any, List

class ValidationRecordResult:
    """Helper class for validation record result."""
    
    @staticmethod
    def create_document(
        record_id: str,
        row_number: int,
        status: str,
        errors: List[str],
        warnings: List[str]
    ) -> Dict[str, Any]:
        """Create a validation record result dictionary."""
        return {
            "record_id": record_id,
            "row_number": row_number,
            "status": status,
            "errors": errors,
            "warnings": warnings
        }

class ValidationResultModel:
    """Model for dataset validation result collection."""

    @staticmethod
    def create_document(
        dataset_id: str,
        workspace_id: str,
        total_records: int,
        valid_count: int,
        invalid_count: int,
        warning_count: int,
        duplicate_count: int,
        quality_score: float,
        record_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new validation result document for MongoDB."""
        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "total_records": total_records,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "warning_count": warning_count,
            "duplicate_count": duplicate_count,
            "quality_score": quality_score,
            "record_results": record_results,
            "validated_at": datetime.now(timezone.utc)
        }
