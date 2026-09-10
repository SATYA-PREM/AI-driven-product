from __future__ import annotations

from bson import ObjectId
from app.core.database import workspace_members_collection
from app.repositories.workspace_repository import workspace_repository
from app.core.permissions import has_permission, Permission, UserRole
from app.core.exceptions import AuthorizationError


class PermissionService:
    """Service for handling Role-Based Access Control (RBAC)."""

    @staticmethod
    def get_user_workspace_role(user_id: str, workspace_id: str, user: dict | None = None) -> str | None:
        """Get a user's role in a specific workspace."""
        user_id_str = str(user_id)
        ws_id_str = str(workspace_id)

        # 1. Check if user is the direct owner of the workspace
        workspace = workspace_repository.get_by_id(ws_id_str)
        if workspace:
            owner_id = str(workspace.get("owner_id") or workspace.get("created_by") or "")
            if owner_id and owner_id == user_id_str:
                return UserRole.PM.value

        # 2. Check explicit workspace membership
        u_matches = [user_id_str]
        if ObjectId.is_valid(user_id_str):
            u_matches.append(ObjectId(user_id_str))

        ws_matches = [ws_id_str]
        if ObjectId.is_valid(ws_id_str):
            ws_matches.append(ObjectId(ws_id_str))

        member = workspace_members_collection.find_one({
            "user_id": {"$in": u_matches},
            "workspace_id": {"$in": ws_matches}
        })
        if member and member.get("role"):
            return str(member.get("role"))

        # 3. Fallback: check user global role if available
        if user and user.get("role"):
            role_val = str(user.get("role")).lower()
            if role_val in [UserRole.PM.value, "pm"]:
                return UserRole.PM.value

        return None

    @staticmethod
    def check_permission(user_id: str, workspace_id: str, permission: Permission, user: dict | None = None) -> bool:
        """Check if a user has a specific permission in a workspace."""
        role = PermissionService.get_user_workspace_role(user_id, workspace_id, user)
        if not role:
            return False
        return has_permission(role, permission)

    @staticmethod
    def require_permission(user: dict, workspace_id: str, permission: Permission) -> None:
        """Raise AuthorizationError if the user lacks the required permission."""
        user_id = str(user.get("_id") or user.get("id", ""))
        if not PermissionService.check_permission(user_id, workspace_id, permission, user):
            raise AuthorizationError("You do not have permission to perform this action.")


permission_service = PermissionService()
