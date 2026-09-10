"""
worker_manager.py
------------------
Manages background processing pipeline execution using asyncio.
Chains workers in sequence: ingestion → validation → cleaning → preprocessing.
"""

from __future__ import annotations

import asyncio
import traceback
from datetime import datetime, timezone

from app.core.constants import JobStatus, JobStep, DatasetStatus
from app.core.logging import get_logger
from app.repositories.processing_job_repository import processing_job_repository
from app.repositories.dataset_repository import dataset_repository

logger = get_logger(__name__)


async def run_pipeline_async(
    dataset_id: str,
    workspace_id: str,
    job_id: str,
) -> None:
    """
    Run the full data pipeline in the background.
    Called as an asyncio task from the API layer.

    Pipeline: Ingestion → Validation → Cleaning → Preprocessing
    """
    logger.info(f"Starting pipeline for dataset={dataset_id}, job={job_id}")

    try:
        # Mark job as running
        processing_job_repository.update_status(job_id, JobStatus.RUNNING)

        # Step 1: Validation
        await _run_step(
            job_id=job_id,
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            step=JobStep.VALIDATION,
            progress=25.0,
        )

        # Step 2: Cleaning
        await _run_step(
            job_id=job_id,
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            step=JobStep.CLEANING,
            progress=50.0,
        )

        # Step 3: Preprocessing
        await _run_step(
            job_id=job_id,
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            step=JobStep.PREPROCESSING,
            progress=75.0,
        )

        # Mark completed
        processing_job_repository.mark_completed(job_id)
        dataset_repository.update_status(dataset_id, DatasetStatus.READY)
        logger.info(f"Pipeline completed for dataset={dataset_id}, job={job_id}")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        logger.error(f"Pipeline failed for dataset={dataset_id}: {error_msg}")
        processing_job_repository.mark_failed(job_id, str(e))
        dataset_repository.update_status(dataset_id, DatasetStatus.FAILED)


async def _run_step(
    job_id: str,
    dataset_id: str,
    workspace_id: str,
    step: JobStep,
    progress: float,
) -> None:
    """Run a single pipeline step with status tracking."""
    logger.info(f"Running step={step.value} for dataset={dataset_id}")

    # Update job to current step
    processing_job_repository.update_step(
        job_id=job_id,
        step=step.value,
        status=JobStatus.RUNNING,
        progress=progress,
    )

    # Run the actual step in a thread pool to avoid blocking the event loop
    loop = asyncio.get_event_loop()

    if step == JobStep.VALIDATION:
        from app.workers.validation_worker import run_validation
        result = await loop.run_in_executor(None, run_validation, dataset_id, workspace_id)

    elif step == JobStep.CLEANING:
        from app.workers.cleaning_worker import run_cleaning
        result = await loop.run_in_executor(None, run_cleaning, dataset_id, workspace_id)

    elif step == JobStep.PREPROCESSING:
        from app.workers.preprocessing_worker import run_preprocessing
        result = await loop.run_in_executor(None, run_preprocessing, dataset_id, workspace_id)

    else:
        result = {}

    # Update step result
    processing_job_repository.update_step(
        job_id=job_id,
        step=step.value,
        status=JobStatus.COMPLETED,
        progress=progress,
        step_result=result,
    )


def start_pipeline_background(
    dataset_id: str,
    workspace_id: str,
    job_id: str,
) -> None:
    """
    Start the pipeline as a background asyncio task.
    Called from the API layer after file ingestion.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context (FastAPI), create a task
            asyncio.ensure_future(
                run_pipeline_async(dataset_id, workspace_id, job_id)
            )
        else:
            # Fallback for sync context
            loop.run_until_complete(
                run_pipeline_async(dataset_id, workspace_id, job_id)
            )
    except RuntimeError:
        # No event loop exists, create one
        asyncio.run(run_pipeline_async(dataset_id, workspace_id, job_id))
