from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.preprocessing import PreprocessingSummaryResponse, AICheckResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.preprocessing.preprocessing_service import preprocessing_service
from app.services.preprocessing.gemini_checker import gemini_checker
from app.core.constants import Permission
from app.utils.serialization import serialize_document

router = APIRouter(prefix="/datasets", tags=["Preprocessing"], dependencies=[Depends(get_current_user)])


@router.post("/{dataset_id}/preprocess", response_model=PreprocessingSummaryResponse)
def preprocess_dataset(
    dataset_id: str,
    workspace_id: str = Query(...),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = preprocessing_service.preprocess_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
    return serialize_document(result)


@router.get("/{dataset_id}/preprocessing", response_model=PreprocessingSummaryResponse)
def get_preprocessing_results(dataset_id: str, current_user=Depends(get_current_user)):
    result = preprocessing_service.get_preprocessing_results(dataset_id=dataset_id)
    return serialize_document(result)


@router.get("/{dataset_id}/ai-check", response_model=AICheckResponse)
def check_dataset_ai_readiness(
    dataset_id: str,
    sample_size: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_user)
):
    """
    Run Gemini AI semantic quality and readiness check on preprocessed signals.
    """
    result = gemini_checker.check_dataset(dataset_id=dataset_id, sample_size=sample_size)
    return result
