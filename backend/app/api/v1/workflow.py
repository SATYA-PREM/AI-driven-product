from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.schemas.workflow import WorkflowResponse
from app.middleware.auth_middleware import get_current_user
from app.services.workflow.workflow_service import workflow_service
from app.core.exceptions import NotFoundError
from app.utils.serialization import serialize_document

router = APIRouter(prefix="", tags=["Workflow"], dependencies=[Depends(get_current_user)])


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: str, current_user=Depends(get_current_user)):
    result = workflow_service.get_workflow(workflow_id=workflow_id)
    return serialize_document(result)


@router.get("/workspaces/{workspace_id}/workflow", response_model=WorkflowResponse)
def get_workspace_workflow(
    workspace_id: str,
    dataset_id: str = Query(None),
    current_user=Depends(get_current_user)
):
    result = workflow_service.get_workspace_workflow(workspace_id=workspace_id, dataset_id=dataset_id)
    if not result:
        raise NotFoundError("Workflow for workspace", workspace_id)
    return serialize_document(result)
