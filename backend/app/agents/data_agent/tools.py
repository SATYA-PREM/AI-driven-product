"""
tools.py
---------
Tool functions for the Data Agent.
Each tool delegates to the appropriate backend service.

Pattern:
    Agent → Tool → Service → Repository → MongoDB
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.core.exceptions import NotFoundError
from app.repositories.dataset_repository import dataset_repository
from app.repositories.data_repository import DataRepository
from app.repositories.validation_repository import ValidationRepository
from app.repositories.processing_job_repository import processing_job_repository
from app.utils.serialization import serialize_document

logger = get_logger(__name__)

data_repository = DataRepository()
validation_repository = ValidationRepository()


def inspect_dataset(dataset_id: str) -> dict:
    """
    Inspect a dataset to see its metadata, record count, and status.

    Args:
        dataset_id: The ID of the dataset to inspect.

    Returns:
        Dict with dataset metadata.
    """
    dataset = dataset_repository.find_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)

    raw_count = data_repository.count_raw_records(dataset_id)
    cleaned_count = data_repository.count_cleaned_records(dataset_id)
    processed_count = data_repository.count_processed_records(dataset_id)

    result = serialize_document(dataset)
    result["raw_record_count"] = raw_count
    result["cleaned_record_count"] = cleaned_count
    result["processed_record_count"] = processed_count

    return result


def get_job_status(job_id: str) -> dict:
    """
    Check the current status and progress of a processing job.

    Args:
        job_id: The ID of the processing job.

    Returns:
        Dict with job status information.
    """
    job = processing_job_repository.find_by_id(job_id)
    if not job:
        raise NotFoundError("ProcessingJob", job_id)

    return serialize_document(job)


def get_dataset_summary(dataset_id: str) -> dict:
    """
    Get a comprehensive summary of a dataset at each pipeline stage.

    Args:
        dataset_id: The ID of the dataset.

    Returns:
        Dict with counts and status at each stage.
    """
    dataset = dataset_repository.find_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)

    # Get counts at each stage
    raw_count = data_repository.count_raw_records(dataset_id)
    cleaned_count = data_repository.count_cleaned_records(dataset_id)
    processed_count = data_repository.count_processed_records(dataset_id)

    # Get validation summary
    validation = validation_repository.get_summary(dataset_id)

    summary = {
        "dataset_id": dataset_id,
        "filename": dataset.get("filename", ""),
        "format": dataset.get("format", ""),
        "source_type": dataset.get("source_type", ""),
        "status": dataset.get("status", ""),
        "pipeline_stages": {
            "raw_data": {
                "count": raw_count,
                "status": "completed" if raw_count > 0 else "pending",
            },
            "validation": {
                "total": validation.get("total_records", 0) if validation else 0,
                "valid": validation.get("valid_count", 0) if validation else 0,
                "invalid": validation.get("invalid_count", 0) if validation else 0,
                "quality_score": validation.get("quality_score", 0.0) if validation else 0.0,
                "status": "completed" if validation else "pending",
            },
            "cleaned_data": {
                "count": cleaned_count,
                "status": "completed" if cleaned_count > 0 else "pending",
            },
            "processed_data": {
                "count": processed_count,
                "status": "completed" if processed_count > 0 else "pending",
            },
        },
    }

    # Get latest job status
    job = processing_job_repository.find_latest_by_dataset(dataset_id)
    if job:
        summary["latest_job"] = {
            "job_id": str(job.get("_id", "")),
            "status": job.get("status", ""),
            "current_step": job.get("current_step", ""),
            "progress": job.get("progress", 0.0),
        }

    return summary


def validate_dataset(dataset_id: str, workspace_id: str) -> dict:
    """
    Trigger validation for a dataset.

    Args:
        dataset_id: The dataset to validate.
        workspace_id: The workspace context.

    Returns:
        Validation summary dict.
    """
    from app.services.validation.validation_service import ValidationService
    validation_service = ValidationService()
    return validation_service.validate_dataset(dataset_id, workspace_id)


def clean_dataset(dataset_id: str, workspace_id: str) -> dict:
    """
    Trigger cleaning for a dataset.

    Args:
        dataset_id: The dataset to clean.
        workspace_id: The workspace context.

    Returns:
        Cleaning summary dict.
    """
    from app.services.cleaning.cleaning_service import CleaningService
    cleaning_service = CleaningService()
    return cleaning_service.clean_dataset(dataset_id, workspace_id)


def preprocess_dataset(dataset_id: str, workspace_id: str) -> dict:
    """
    Trigger preprocessing for a dataset.

    Args:
        dataset_id: The dataset to preprocess.
        workspace_id: The workspace context.

    Returns:
        Preprocessing summary dict.
    """
    from app.services.preprocessing.preprocessing_service import PreprocessingService
    preprocessing_service = PreprocessingService()
    return preprocessing_service.preprocess_dataset(dataset_id, workspace_id)
