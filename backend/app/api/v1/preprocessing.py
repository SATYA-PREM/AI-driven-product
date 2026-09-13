from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.preprocessing import PreprocessingSummaryResponse, AICheckResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.preprocessing.preprocessing_service import preprocessing_service
from app.services.preprocessing.gemini_checker import gemini_checker
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
    "/{dataset_id}/preprocess",
    response_model=PreprocessingSummaryResponse,
    summary="Step 4.4: Preprocess Cleaned Data into Canonical AI-Ready Records",
    response_description="Preprocessing summary with count of generated AI-ready signals",
)
def preprocess_dataset(
    dataset_id: str,
    workspace_id: str = Query(...),
    current_user=Depends(get_current_user)
):
    """
    **Preprocess into AI-Ready Records:**
    Transforms cleaned data into the canonical schema required by Milestone 2 AI Agents:
    tokenizes feedback, structures metadata, parses dates, and outputs AI-ready feedback signals.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    # Enforce workflow stage gating: must be CLEANED, PREPROCESSED, or FAILED
    workflow_service.validate_dataset_stage(
        dataset_id=dataset_id,
        required_states=[WorkflowState.CLEANED, WorkflowState.PREPROCESSED, WorkflowState.FAILED],
        operation_name="Preprocessing",
    )
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = preprocessing_service.preprocess_dataset(dataset_id=dataset_id, workspace_id=workspace_id, user_id=user_id)
    return serialize_document(result)


@router.get(
    "/{dataset_id}/preprocessing",
    response_model=PreprocessingSummaryResponse,
    summary="Get Preprocessing Summary & Output Records",
)
def get_preprocessing_results(dataset_id: str, current_user=Depends(get_current_user)):
    result = preprocessing_service.get_preprocessing_results(dataset_id=dataset_id)
    return serialize_document(result)


@router.get(
    "/{dataset_id}/ai-check",
    response_model=AICheckResponse,
    summary="Step 4.5: Gemini AI Semantic Quality & Readiness Gate Check",
    response_description="AI semantic evaluation assessing whether signals are ready for Milestone 2 Agents",
)
def check_dataset_ai_readiness(
    dataset_id: str,
    sample_size: int = Query(default=10, ge=1, le=50, description="Sample size of preprocessed records to evaluate"),
    current_user=Depends(get_current_user)
):
    """
    **AI Semantic Quality Verification Gate:**
    Uses Gemini LLM to semantically probe preprocessed feedback signals. Checks for informativeness,
    sentiment coherence, and absence of residual noise before initiating 3-Agent AI analysis.
    """
    result = gemini_checker.check_dataset(dataset_id=dataset_id, sample_size=sample_size)
    return result
