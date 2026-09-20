"""
datasets.py
-----------
FastAPI routes for Dataset Ingestion & Lifecycle Management.
Phase 3 in the Master Business Sequence:
    Authentication → Workspace → Datasets (Upload) → Validation → Cleaning → Preprocessing → AI Analysis
"""

from __future__ import annotations
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, status

from app.schemas.data import DatasetResponse, DatasetUpdateRequest
from app.schemas.ingestion import UploadResponse
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.ingestion.ingestion_service import ingestion_service
from app.services.workspace.activity_service import activity_service
from app.repositories.dataset_repository import dataset_repository
from app.repositories.data_repository import data_repository
from app.workflow.workflow_service import workflow_service
from app.core.constants import Permission
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(
    prefix="/datasets",
    tags=["3. Data Ingestion & Datasets"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload Raw Customer Feedback Dataset",
    response_description="Ingestion result with dataset ID and raw record count",
)
async def upload_dataset_canonical(
    workspace_id: str = Query(..., description="Target workspace ID"),
    product_id: str = Query(..., description="Target product ID"),
    source_type: str = Query(default="feedback", description="Type of feedback: support_tickets, reviews, feedback, feature_requests, etc."),
    dataset_name: Optional[str] = Query(None, description="Custom dataset batch name/label"),
    file: UploadFile = File(..., description="Raw data file to ingest (CSV, JSON)"),
    current_user=Depends(get_current_user),
):
    """
    Ingest a raw customer feedback file.
    Saves metadata, parses records into raw_data collection,
    and sets status to 'UPLOADED'.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.UPLOAD_DATASET)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    file_bytes = await file.read()
    filename = file.filename or "uploaded_file.csv"

    result = ingestion_service.ingest_file(
        workspace_id=workspace_id,
        product_id=product_id,
        source_type=source_type,
        filename=filename,
        dataset_name=dataset_name or "",
        file_bytes=file_bytes,
        uploaded_by=user_id,
    )

    activity_service.log_activity(
        workspace_id=workspace_id,
        action="dataset_uploaded",
        title=f'Dataset "{dataset_name or filename}" uploaded',
        description=f"Ingested {result.get('record_count', 0)} feedback records ({source_type})",
        user_id=user_id,
        metadata={"dataset_id": str(result.get("id") or result.get("dataset_id")), "record_count": result.get("record_count", 0)}
    )

    return serialize_document(result)


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload Raw Customer Feedback Dataset (POST /datasets/upload)",
    response_description="Ingestion result with dataset ID and raw record count",
)
async def upload_file(
    workspace_id: str = Query(..., description="Target workspace ID"),
    product_id: str = Query(..., description="Target product ID"),
    source_type: str = Query(default="feedback", description="Type of feedback"),
    dataset_name: Optional[str] = Query(None, description="Custom dataset batch name/label"),
    file: UploadFile = File(..., description="Raw data file to ingest"),
    current_user=Depends(get_current_user),
):
    """Compatible alias endpoint for upload."""
    return await upload_dataset_canonical(
        workspace_id=workspace_id,
        product_id=product_id,
        source_type=source_type,
        dataset_name=dataset_name,
        file=file,
        current_user=current_user,
    )


@router.get("", response_model=List[DatasetResponse], summary="List Datasets in Workspace")
def list_datasets(workspace_id: str = Query(...), current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    results = dataset_repository.find_by_workspace(workspace_id)
    return serialize_documents(results)


@router.get("/{dataset_id}", response_model=DatasetResponse, summary="Get Dataset by ID")
def get_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    dataset = (
        getattr(dataset_repository, "get_by_id", lambda x: None)(dataset_id)
        or dataset_repository.find_by_id(dataset_id)
    )
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    return serialize_document(dataset)


@router.get("/{dataset_id}/status", summary="Get Master Pipeline Progress & Status for Dataset")
def get_dataset_workflow_status(dataset_id: str, current_user=Depends(get_current_user)) -> dict[str, Any]:
    """
    Returns the real-time workflow status and visual stage progress:
    UPLOADED → VALIDATED → CLEANED → PREPROCESSED → AI_ANALYSIS → INTELLIGENCE → REPORT
    """
    return workflow_service.get_dataset_workflow_status(dataset_id)


@router.get("/{dataset_id}/raw", summary="Get Raw Ingested Records")
def get_raw_records(dataset_id: str, limit: int = Query(default=100, ge=1, le=1000), current_user=Depends(get_current_user)):
    records = data_repository.get_raw_records(dataset_id=dataset_id, limit=limit)
    return serialize_documents(records)


@router.get(
    "/{dataset_id}/records",
    summary="Get Records & Record IDs for a Dataset",
    response_description="List of records with their database IDs and source record identifiers across pipeline stages",
)
def get_dataset_records(
    dataset_id: str,
    stage: str = Query("raw", description="Stage of data: 'raw', 'cleaned', or 'processed'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """
    **Retrieve records and their Record IDs for a dataset:**
    - `raw`: Initial ingested records containing `id` (MongoDB ObjectId), `source_record_id`, `row_number`, and `original_record`.
    - `cleaned`: Sanitized and deduplicated records.
    - `processed`: Canonical AI-ready signals containing `source_id`, `customer_id`, and `id`.
    """
    dataset = (
        getattr(dataset_repository, "get_by_id", lambda x: None)(dataset_id)
        or dataset_repository.find_by_id(dataset_id)
    )
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    permission_service.require_permission(current_user, dataset.get("workspace_id", ""), Permission.VIEW_DATASET)

    stage_lower = stage.lower()
    if stage_lower == "cleaned":
        records = data_repository.get_cleaned_records(dataset_id, skip=skip, limit=limit)
    elif stage_lower == "processed":
        records = data_repository.get_processed_records(dataset_id, skip=skip, limit=limit)
    else:
        records = data_repository.get_raw_records(dataset_id, skip=skip, limit=limit)

    return serialize_documents(records)


@router.patch("/{dataset_id}", response_model=DatasetResponse, summary="Update Dataset Metadata")
def update_dataset(
    dataset_id: str,
    payload: DatasetUpdateRequest,
    current_user=Depends(get_current_user),
):
    dataset = (
        getattr(dataset_repository, "get_by_id", lambda x: None)(dataset_id)
        or dataset_repository.find_by_id(dataset_id)
    )
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    permission_service.require_permission(current_user, dataset.get("workspace_id", ""), Permission.UPLOAD_DATASET)

    update_fields = {}
    if payload.filename is not None and payload.filename.strip():
        update_fields["filename"] = payload.filename.strip()
    elif payload.name is not None and payload.name.strip():
        update_fields["filename"] = payload.name.strip()
    if payload.description is not None:
        update_fields["description"] = payload.description.strip()
    if payload.source_type is not None and payload.source_type.strip():
        update_fields["source_type"] = payload.source_type.strip()

    if update_fields:
        dataset_repository.update(dataset_id, update_fields)
        dataset.update(update_fields)
        activity_service.log_activity(
            workspace_id=dataset.get("workspace_id", ""),
            action="dataset_updated",
            title=f'Dataset "{dataset.get("filename")}" updated',
            description=f"Updated metadata for dataset {dataset_id}",
            user_id=str(current_user.get("_id") or current_user.get("id")),
            metadata={"dataset_id": dataset_id, "updated_fields": list(update_fields.keys())}
        )

    updated_doc = (
        getattr(dataset_repository, "get_by_id", lambda x: None)(dataset_id)
        or dataset_repository.find_by_id(dataset_id)
        or dataset
    )
    return serialize_document(updated_doc)


@router.delete("/{dataset_id}", response_model=SuccessResponse, summary="Delete Dataset")
def delete_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    dataset = (
        getattr(dataset_repository, "get_by_id", lambda x: None)(dataset_id)
        or dataset_repository.find_by_id(dataset_id)
    )
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    workspace_id = dataset.get("workspace_id", "")
    permission_service.require_permission(current_user, workspace_id, Permission.DELETE_DATASET)
    dataset_repository.delete(dataset_id)

    activity_service.log_activity(
        workspace_id=workspace_id,
        action="dataset_deleted",
        title=f'Dataset "{dataset.get("filename")}" deleted',
        description=f"Dataset {dataset_id} removed",
        user_id=str(current_user.get("_id") or current_user.get("id")),
        metadata={"dataset_id": dataset_id}
    )

    return SuccessResponse(success=True, message="Dataset deleted successfully")
