from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.validation import ValidationSummaryResponse, ValidationDetailResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.validation.validation_service import validation_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document

router = APIRouter(
    prefix="/datasets",
    tags=["4. Data Agent - Dirty Data Preprocessing"],
    dependencies=[Depends(get_current_user)],
)


from app.workflow.states import WorkflowState
from app.workflow.workflow_service import workflow_service

@router.post(
    "/{dataset_id}/validate",
    response_model=ValidationSummaryResponse,
    summary="Step 4.2: Validate Raw Dataset Schema & Calculate Quality Score",
    response_description="Validation summary with valid/invalid record counts and quality score",
)
def validate_dataset(
    dataset_id: str,
    workspace_id: str = Query(...),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    # Enforce workflow stage gating: must be CREATED, UPLOADED, or FAILED (retry)
    workflow_service.validate_dataset_stage(
        dataset_id=dataset_id,
        required_states=[WorkflowState.CREATED, WorkflowState.UPLOADED, WorkflowState.FAILED],
        operation_name="Validation",
    )
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = validation_service.validate_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
    return serialize_document(result)


@router.get(
    "/{dataset_id}/validation",
    response_model=ValidationDetailResponse,
    summary="Get Dataset Validation Details & Field Errors",
)
def get_validation_results(dataset_id: str, current_user=Depends(get_current_user)):
    result = validation_service.get_validation_results(dataset_id=dataset_id)
    return serialize_document(result)
