"""
cleaning_worker.py
-------------------
Background worker for dataset cleaning.
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.services.cleaning.cleaning_service import CleaningService

logger = get_logger(__name__)

cleaning_service = CleaningService()


def run_cleaning(dataset_id: str, workspace_id: str) -> dict:
    """
    Run cleaning for a dataset.
    Called by worker_manager as part of the pipeline.
    """
    logger.info(f"Cleaning worker: starting dataset={dataset_id}")
    result = cleaning_service.clean_dataset(dataset_id, workspace_id)
    logger.info(
        f"Cleaning worker: completed dataset={dataset_id}, "
        f"cleaned={result.get('cleaned_count', 0)}"
    )
    return result
