"""
ingestion_worker.py
--------------------
Background worker for file ingestion.
Parses uploaded files and stores raw records.

Note: In Milestone 1, ingestion is done synchronously during upload
by ingestion_service. This worker exists for future async ingestion
of very large files.
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.services.ingestion.ingestion_service import IngestionService

logger = get_logger(__name__)

ingestion_service = IngestionService()


def run_ingestion(
    dataset_id: str,
    workspace_id: str,
    file_path: str = "",
) -> dict:
    """
    Run ingestion for a dataset.
    Currently a passthrough since ingestion happens during upload.
    """
    logger.info(f"Ingestion worker: dataset={dataset_id} (already ingested during upload)")
    return {"status": "completed", "message": "Ingestion completed during upload"}
