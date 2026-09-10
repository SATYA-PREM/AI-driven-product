from __future__ import annotations
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from typing import List

from app.schemas.data import DatasetResponse
from app.schemas.ingestion import UploadResponse
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.ingestion.ingestion_service import ingestion_service
from app.repositories.dataset_repository import dataset_repository
from app.core.constants import Permission
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(prefix="/datasets", tags=["Datasets"], dependencies=[Depends(get_current_user)])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_file(
    workspace_id: str = Query(...),
    product_id: str = Query(...),
    source_type: str = Query(default="feedback"),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.UPLOAD_DATASET)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    file_bytes = await file.read()
    
    result = ingestion_service.ingest_file(
        workspace_id=workspace_id,
        product_id=product_id,
        source_type=source_type,
        filename=file.filename,
        file_bytes=file_bytes,
        uploaded_by=user_id
    )
    return serialize_document(result)


@router.get("/", response_model=List[DatasetResponse])
def list_datasets(workspace_id: str = Query(...), current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    results = dataset_repository.find_by_workspace(workspace_id)
    return serialize_documents(results)


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    dataset = dataset_repository.get_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    permission_service.require_permission(current_user, dataset.get("workspace_id", ""), Permission.VIEW_WORKSPACE)
    return serialize_document(dataset)


@router.delete("/{dataset_id}", response_model=SuccessResponse)
def delete_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    dataset = dataset_repository.get_by_id(dataset_id)
    if not dataset:
        raise NotFoundError("Dataset", dataset_id)
    permission_service.require_permission(current_user, dataset.get("workspace_id", ""), Permission.DELETE_DATASET)
    dataset_repository.delete(dataset_id)
    return SuccessResponse(success=True, message="Dataset deleted successfully")
