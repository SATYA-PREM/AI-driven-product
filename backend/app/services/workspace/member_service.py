from __future__ import annotations

from bson import ObjectId
from app.core.database import workspace_members_collection
from app.repositories.user_repository import user_repository
from app.repositories.workspace_repository import workspace_repository
from app.models.workspace_member import WorkspaceMemberModel
from app.core.exceptions import NotFoundError, DuplicateError, AuthorizationError
from app.services.workspace.activity_service import activity_service
from app.utils.serialization import serialize_document

class MemberService:
    """Service for managing workspace members."""

    @staticmethod
    def add_member(workspace_id: str, email: str, role: str, added_by_user_id: str) -> dict:
        """Add a new member to a workspace by email."""
        user = user_repository.get_by_email(email)
        if not user:
            raise NotFoundError(f"User with email {email} not found.")

        user_id = str(user["_id"])
        ws_id_obj = ObjectId(workspace_id)
        u_id_obj = ObjectId(user_id)

        existing = workspace_members_collection.find_one({
            "workspace_id": ws_id_obj,
            "user_id": u_id_obj
        })
        if existing:
            raise DuplicateError(f"User {email} is already a member of this workspace.")

        member_doc = WorkspaceMemberModel.create_document(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
            added_by=added_by_user_id
        )
        member_doc["workspace_id"] = ws_id_obj
        member_doc["user_id"] = u_id_obj
        member_doc["added_by"] = ObjectId(added_by_user_id) if ObjectId.is_valid(added_by_user_id) else added_by_user_id

        workspace_members_collection.insert_one(member_doc)

        user_name = user.get("name", "")
        user_email = user.get("email", "")

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="member_added",
            title=f"Member added: {user_email}",
            description=f"Added as {role.upper()}",
            user_id=added_by_user_id,
            metadata={"member_user_id": user_id, "role": role}
        )

        serialized = serialize_document(member_doc)
        serialized["name"] = user_name
        serialized["email"] = user_email
        serialized["user_name"] = user_name
        serialized["user_email"] = user_email
        return serialized

    @staticmethod
    def list_members(workspace_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """List all members in a workspace, including user info."""
        ws_id_obj = ObjectId(workspace_id) if ObjectId.is_valid(workspace_id) else workspace_id
        
        pipeline = [
            {"$match": {"workspace_id": ws_id_obj}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user_info"
                }
            },
            {
                "$unwind": {
                    "path": "$user_info",
                    "preserveNullAndEmptyArrays": True
                }
            }
        ]
        
        members = list(workspace_members_collection.aggregate(pipeline))
        results = []
        for m in members:
            m_serialized = serialize_document(m)
            u_info = m.get("user_info")
            if not u_info:
                uid = str(m.get("user_id", ""))
                u_doc = user_repository.get_by_id(uid) if uid else None
                u_info = u_doc or {}

            user_name = u_info.get("name") or m_serialized.get("user_name") or m_serialized.get("name") or ""
            user_email = u_info.get("email") or m_serialized.get("user_email") or m_serialized.get("email") or ""
            m_serialized["name"] = user_name
            m_serialized["email"] = user_email
            m_serialized["user_name"] = user_name
            m_serialized["user_email"] = user_email
            if "user_info" in m_serialized:
                del m_serialized["user_info"]
            results.append(m_serialized)
            
        return results

    @staticmethod
    def update_member_role(workspace_id: str, user_id: str, new_role: str) -> dict:
        """Update a member's role in the workspace."""
        ws_id_obj = ObjectId(workspace_id) if ObjectId.is_valid(workspace_id) else workspace_id
        u_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        result = workspace_members_collection.find_one_and_update(
            {"workspace_id": ws_id_obj, "user_id": u_id_obj},
            {"$set": {"role": new_role}},
            return_document=True
        )
        
        if not result:
            raise NotFoundError(f"Member with user_id {user_id} not found in workspace.")
        
        serialized = serialize_document(result)
        user = user_repository.get_by_id(user_id)
        u_info = user or {}
        user_name = u_info.get("name", "")
        user_email = u_info.get("email", "")

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="member_role_updated",
            title=f"Role updated: {user_email or user_id}",
            description=f"Role changed to {new_role.upper()}",
            metadata={"member_user_id": user_id, "role": new_role}
        )

        serialized["name"] = user_name
        serialized["email"] = user_email
        serialized["user_name"] = user_name
        serialized["user_email"] = user_email
        return serialized

    @staticmethod
    def remove_member(workspace_id: str, user_id: str) -> bool:
        """Remove a member from the workspace."""
        ws_id_obj = ObjectId(workspace_id) if ObjectId.is_valid(workspace_id) else workspace_id
        u_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        workspace = workspace_repository.get_by_id(workspace_id)
        if not workspace:
            raise NotFoundError(f"Workspace with ID {workspace_id} not found.")

        if str(workspace.get("created_by")) == str(user_id):
            raise AuthorizationError("Cannot remove the workspace owner.")

        result = workspace_members_collection.delete_one({
            "workspace_id": ws_id_obj,
            "user_id": u_id_obj
        })
        
        if result.deleted_count == 0:
            raise NotFoundError(f"Member with user_id {user_id} not found in workspace.")

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="member_removed",
            title="Team member removed",
            description=f"Member ID {user_id} removed from workspace",
            metadata={"member_user_id": user_id}
        )
            
        return True

member_service = MemberService()
