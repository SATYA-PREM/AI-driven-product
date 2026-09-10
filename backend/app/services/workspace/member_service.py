from __future__ import annotations

from bson import ObjectId
from app.core.database import workspace_members_collection
from app.repositories.user_repository import user_repository
from app.repositories.workspace_repository import workspace_repository
from app.models.workspace_member import WorkspaceMemberModel
from app.core.exceptions import NotFoundError, DuplicateError, AuthorizationError
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
        return serialize_document(member_doc)

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
            {"$unwind": "$user_info"}
        ]
        
        members = list(workspace_members_collection.aggregate(pipeline))
        results = []
        for m in members:
            m_serialized = serialize_document(m)
            m_serialized["user_name"] = m["user_info"].get("name")
            m_serialized["user_email"] = m["user_info"].get("email")
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
        return serialize_document(result)

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
            
        return True

member_service = MemberService()
