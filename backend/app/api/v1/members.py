"""
members.py
----------
FastAPI routes for Workspace Team Member Management.
Phase 2 in the Master Business Sequence:
    Authentication → Workspace & Members → Data Ingestion → ...
"""

from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends

from app.schemas.workspace import MemberCreate, MemberUpdate, MemberResponse
from app.schemas.common import SuccessResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth.permission_service import permission_service
from app.services.workspace.member_service import member_service
from app.core.constants import Permission
from app.utils.serialization import serialize_document, serialize_documents

router = APIRouter(
    prefix="/workspaces/{workspace_id}/members",
    tags=["2. Workspaces & Products"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=MemberResponse, summary="Add Member to Workspace")
def add_member(workspace_id: str, body: MemberCreate, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    user_id = str(current_user.get("_id") or current_user.get("id"))
    result = member_service.add_member(
        workspace_id=workspace_id,
        email=body.email,
        role=body.role,
        added_by_user_id=user_id,
    )
    return serialize_document(result)


@router.get("", response_model=List[MemberResponse], summary="List Workspace Members")
def list_members(workspace_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.VIEW_WORKSPACE)
    results = member_service.list_members(workspace_id)
    return serialize_documents(results)


@router.patch("/{user_id}", response_model=MemberResponse, summary="Update Member Role")
def update_member_role(workspace_id: str, user_id: str, body: MemberUpdate, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    result = member_service.update_member_role(workspace_id, user_id, body.role)
    return serialize_document(result)


@router.delete("/{user_id}", response_model=SuccessResponse, summary="Remove Member from Workspace")
def remove_member(workspace_id: str, user_id: str, current_user=Depends(get_current_user)):
    permission_service.require_permission(current_user, workspace_id, Permission.MANAGE_MEMBERS)
    member_service.remove_member(workspace_id, user_id)
    return SuccessResponse(success=True, message="Member removed successfully")
