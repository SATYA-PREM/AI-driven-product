"""
preprocessing_worker.py
------------------------
Background worker for dataset preprocessing.
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.services.preprocessing.preprocessing_service import PreprocessingService

logger = get_logger(__name__)

preprocessing_service = PreprocessingService()


def run_preprocessing(dataset_id: str, workspace_id: str) -> dict:
    """
    Run preprocessing for a dataset.
    Called by worker_manager as part of the pipeline.
    """
    logger.info(f"Preprocessing worker: starting dataset={dataset_id}")
    result = preprocessing_service.preprocess_dataset(dataset_id, workspace_id)
    logger.info(
        f"Preprocessing worker: completed dataset={dataset_id}, "
        f"processed={result.get('processed_count', 0)}"
    )
    return result
