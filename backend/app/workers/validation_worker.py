"""
validation_worker.py
---------------------
Background worker for dataset validation.
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.services.validation.validation_service import ValidationService

logger = get_logger(__name__)

validation_service = ValidationService()


def run_validation(dataset_id: str, workspace_id: str) -> dict:
    """
    Run validation for a dataset.
    Called by worker_manager as part of the pipeline.
    """
    logger.info(f"Validation worker: starting dataset={dataset_id}")
    result = validation_service.validate_dataset(dataset_id, workspace_id)
    logger.info(
        f"Validation worker: completed dataset={dataset_id}, "
        f"valid={result.get('valid_count', 0)}, invalid={result.get('invalid_count', 0)}"
    )
    return result
