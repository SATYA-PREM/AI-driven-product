"""
data_agent.py
-------------
API routes for the Data Agent's dirty data preprocessing pipeline.
Exposes tools and automated orchestration for transforming messy,
unnormalized raw feedback into validated, cleaned, AI-ready records.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from typing import Dict, Any, List

from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.agents.data_agent.agent import data_agent
from app.core.constants import Permission
from app.utils.serialization import serialize_document

router = APIRouter(
    prefix="/data-agent",
    tags=["4. Data Agent - Dirty Data Preprocessing"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/datasets/{dataset_id}/pipeline",
    status_code=status.HTTP_200_OK,
    summary="Data Agent: Run Full Dirty Data Preprocessing Pipeline",
    response_description="Detailed pipeline execution summary across all 4 stages (Inspect → Validate → Clean → Preprocess)",
)
def run_data_agent_pipeline(
    dataset_id: str,
    workspace_id: str = Query(..., description="Target workspace ID for permissions and context"),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    **Data Agent Dirty Data Pipeline Orchestrator:**
    Executes the automated 4-stage pipeline on raw, dirty customer data:
    1. **Inspect**: Detects record counts, columns, and data formats.
    2. **Validate**: Checks required fields, rating boundaries, and calculates a 0–100% Quality Score.
    3. **Clean**: Deduplicates records, sanitizes HTML/script injections, handles missing attributes.
    4. **Preprocess**: Transforms records into canonical AI-ready text signals for Milestone 2 AI Agents.
    """
    permission_service.require_permission(current_user, workspace_id, Permission.RUN_PIPELINE)
    result = data_agent.run_full_pipeline(
        dataset_id=dataset_id,
        workspace_id=workspace_id,
    )
    return serialize_document(result)


@router.get(
    "/datasets/{dataset_id}/inspect",
    summary="Data Agent: Inspect Raw Dirty Dataset",
    response_description="Dataset metadata, raw/cleaned/processed record counts, and status",
)
def inspect_dataset(
    dataset_id: str,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    **Data Agent Inspection Tool:**
    Sniffs the raw dirty dataset to inspect file metadata, record volume, and current
    processing stage status before starting cleaning or AI transformations.
    """
    result = data_agent.execute_tool("inspect_dataset", dataset_id=dataset_id)
    return serialize_document(result)


@router.get(
    "/datasets/{dataset_id}/summary",
    summary="Data Agent: Complete Dataset Preprocessing Lifecycle Summary",
    response_description="Multi-stage breakdown: raw dirty count, valid/invalid counts, quality score, cleaned count, and AI-ready count",
)
def get_dataset_summary(
    dataset_id: str,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    **Data Agent Summary Tool:**
    Provides a comprehensive lifecycle report of the dataset across:
    - **Raw Data**: Count of initially ingested dirty records.
    - **Validation**: Valid vs invalid counts and overall Quality Score.
    - **Cleaned Data**: Successfully sanitized and deduplicated records.
    - **Processed Data**: Canonical AI-ready records ready for Agent 1, 2, and 3.
    """
    result = data_agent.execute_tool("get_dataset_summary", dataset_id=dataset_id)
    return serialize_document(result)


@router.get(
    "/tools",
    summary="Data Agent: List Registered Preprocessing Tools",
    response_description="Catalog of tools available to the Data Agent",
)
def list_data_agent_tools(
    current_user=Depends(get_current_user),
) -> List[Dict[str, str]]:
    """
    Lists all backend preprocessing and inspection tools registered with the Data Agent.
    """
    return data_agent.list_tools()

