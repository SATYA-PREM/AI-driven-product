from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.validation import ValidationSummaryResponse, ValidationDetailResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.validation.validation_service import validation_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document

router = APIRouter(prefix="/datasets", tags=["Validation"], dependencies=[Depends(get_current_user)])


@router.post("/{dataset_id}/validate", response_model=ValidationSummaryResponse)
def validate_dataset(
    dataset_id: str,
    workspace_id: str = Query(...),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = validation_service.validate_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
    return serialize_document(result)


@router.get("/{dataset_id}/validation", response_model=ValidationDetailResponse)
def get_validation_results(dataset_id: str, current_user=Depends(get_current_user)):
    result = validation_service.get_validation_results(dataset_id=dataset_id)
    return serialize_document(result)
