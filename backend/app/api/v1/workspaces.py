from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import List

from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, ActivityResponse
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.workspace.workspace_service import workspace_service
from app.services.workspace.activity_service import activity_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(prefix="/workspaces", tags=["2. Workspaces & Products"], dependencies=[Depends(get_current_user)])


@router.post("/", response_model=WorkspaceResponse)
def create_workspace(body: WorkspaceCreate, current_user=Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    settings = dict(body.settings or {})
    if body.product_name:
        settings["product_name"] = body.product_name
    if body.industry:
        settings["industry"] = body.industry
    if body.timezone:
        settings["timezone"] = body.timezone
    if body.currency:
        settings["currency"] = body.currency
    if body.icon:
        settings["icon"] = body.icon

    result = workspace_service.create_workspace(
        name=body.name,
        description=body.description,
        owner_id=user_id,
        settings=settings
    )
    return serialize_document(result)


@router.get("/", response_model=List[WorkspaceResponse])
def list_user_workspaces(current_user=Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    results = workspace_service.list_user_workspaces(user_id)
    return serialize_documents(results)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    result = workspace_service.get_workspace(workspace_id)
    return serialize_document(result)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(workspace_id: str, body: WorkspaceUpdate, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.UPDATE_WORKSPACE)
    update_dict = body.model_dump(exclude_unset=True)

    # Merge top-level settings into settings dict
    existing = workspace_service.get_workspace(workspace_id)
    settings = dict(existing.get("settings") or {})
    if "settings" in update_dict and isinstance(update_dict["settings"], dict):
        settings.update(update_dict.pop("settings"))

    for field in ["product_name", "industry", "timezone", "currency", "icon"]:
        if field in update_dict and update_dict[field] is not None:
            settings[field] = update_dict.pop(field)

    update_dict["settings"] = settings
    result = workspace_service.update_workspace(workspace_id, update_dict)
    return serialize_document(result)


@router.delete("/{workspace_id}", response_model=SuccessResponse)
def delete_workspace(workspace_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.DELETE_WORKSPACE)
    workspace_service.delete_workspace(workspace_id)
    return SuccessResponse(success=True, message="Workspace deleted successfully")


@router.get("/{workspace_id}/activity", response_model=List[ActivityResponse], summary="Get Workspace Recent Activity")
def get_workspace_activity(
    workspace_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    logs = activity_service.get_workspace_activities(workspace_id, limit=limit)
    return serialize_documents(logs)
