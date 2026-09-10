from __future__ import annotations
from fastapi import APIRouter, Depends
from typing import List

from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, MemberAdd, MemberUpdate, MemberResponse
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.workspace.workspace_service import workspace_service
from app.services.workspace.member_service import member_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(prefix="/workspaces", tags=["Workspaces"], dependencies=[Depends(get_current_user)])


@router.post("/", response_model=WorkspaceResponse)
def create_workspace(body: WorkspaceCreate, current_user=Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = workspace_service.create_workspace(
        name=body.name,
        description=body.description,
        owner_id=user_id
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
    result = workspace_service.update_workspace(workspace_id, update_dict)
    return serialize_document(result)


@router.delete("/{workspace_id}", response_model=SuccessResponse)
def delete_workspace(workspace_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.DELETE_WORKSPACE)
    workspace_service.delete_workspace(workspace_id)
    return SuccessResponse(success=True, message="Workspace deleted successfully")


@router.post("/{workspace_id}/members", response_model=MemberResponse)
def add_member(workspace_id: str, body: MemberAdd, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = member_service.add_member(
        workspace_id=workspace_id,
        email=body.email,
        role=body.role,
        added_by_user_id=user_id
    )
    return serialize_document(result)


@router.get("/{workspace_id}/members", response_model=List[MemberResponse])
def list_members(workspace_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    results = member_service.list_members(workspace_id)
    return serialize_documents(results)


@router.patch("/{workspace_id}/members/{user_id}", response_model=MemberResponse)
def update_member_role(workspace_id: str, user_id: str, body: MemberUpdate, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    result = member_service.update_member_role(workspace_id, user_id, body.role)
    return serialize_document(result)


@router.delete("/{workspace_id}/members/{user_id}", response_model=SuccessResponse)
def remove_member(workspace_id: str, user_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    member_service.remove_member(workspace_id, user_id)
    return SuccessResponse(success=True, message="Member removed successfully")
