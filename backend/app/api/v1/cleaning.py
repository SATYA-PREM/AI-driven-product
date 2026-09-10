from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.cleaning import CleaningSummaryResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.cleaning.cleaning_service import cleaning_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document

router = APIRouter(prefix="/datasets", tags=["Cleaning"], dependencies=[Depends(get_current_user)])


@router.post("/{dataset_id}/clean", response_model=CleaningSummaryResponse)
def clean_dataset(
    dataset_id: str,
    workspace_id: str = Query(...),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = cleaning_service.clean_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
    return serialize_document(result)


@router.get("/{dataset_id}/cleaning", response_model=CleaningSummaryResponse)
def get_cleaning_results(dataset_id: str, current_user=Depends(get_current_user)):
    result = cleaning_service.get_cleaning_results(dataset_id=dataset_id)
    return serialize_document(result)
