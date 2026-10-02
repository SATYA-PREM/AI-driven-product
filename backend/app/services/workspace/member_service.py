from __future__ import annotations

from bson import ObjectId
from app.core.database import workspace_members_collection
from app.repositories.user_repository import user_repository
from app.repositories.workspace_repository import workspace_repository
from app.models.workspace_member import WorkspaceMemberModel
from app.core.exceptions import NotFoundError, DuplicateError, AuthorizationError
from app.services.workspace.activity_service import activity_service
from app.utils.serialization import serialize_document

from app.core.security import hash_password
from app.models.user import UserModel
from app.core.database import users_collection


class MemberService:
    """Service for managing workspace members."""

    @staticmethod
    def add_member(
        workspace_id: str,
        email: str,
        role: str,
        added_by_user_id: str,
        name: str | None = None,
        password: str | None = None,
    ) -> dict:
        """Add a new member to a workspace by email, creating the user if they do not exist."""
        clean_email = email.strip().lower()
        user = user_repository.get_by_email(clean_email)

        if not user:
            # Create a new user with username/name and password
            raw_password = password or "Welcome@123"
            hashed_pwd = hash_password(raw_password)
            user_display_name = (name or "").strip() or clean_email.split("@")[0].replace(".", " ").title()
            
            # Map workspace role to user role if needed
            user_role = "pm" if "pm" in role.lower() or "product_manager" in role.lower() else "member"
            user_doc = UserModel.create_document(
                name=user_display_name,
                email=clean_email,
                password_hash=hashed_pwd,
                hashed_password=hashed_pwd,
                role=user_role,
                is_active=True,
            )
            res = users_collection.insert_one(user_doc)
            user_doc["_id"] = res.inserted_id
            user = user_doc

        user_id = str(user["_id"])
        ws_id_obj = ObjectId(workspace_id)
        u_id_obj = ObjectId(user_id)

        existing = workspace_members_collection.find_one({
            "workspace_id": ws_id_obj,
            "user_id": u_id_obj
        })
        if existing:
            raise DuplicateError(f"User {clean_email} is already a member of this workspace.")

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
        user_email = user.get("email", clean_email)

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
        ws_id_str = str(workspace_id)
        ws_conditions = [ws_id_str]
        if ObjectId.is_valid(ws_id_str):
            ws_conditions.append(ObjectId(ws_id_str))

        docs = list(workspace_members_collection.find({"workspace_id": {"$in": ws_conditions}}).skip(skip).limit(limit))
        
        # If no members recorded yet, check if workspace has owner and auto-heal
        if not docs:
            ws = workspace_repository.get_by_id(ws_id_str)
            if ws and ws.get("owner_id"):
                owner_id = str(ws["owner_id"])
                owner_user = user_repository.get_by_id(owner_id)
                if owner_user:
                    member_doc = WorkspaceMemberModel.create_document(
                        workspace_id=ws_id_str,
                        user_id=owner_id,
                        role="product_manager",
                        added_by=owner_id
                    )
                    if ObjectId.is_valid(ws_id_str):
                        member_doc["workspace_id"] = ObjectId(ws_id_str)
                    if ObjectId.is_valid(owner_id):
                        member_doc["user_id"] = ObjectId(owner_id)
                        member_doc["added_by"] = ObjectId(owner_id)
                    workspace_members_collection.insert_one(member_doc)
                    docs = [member_doc]

        results = []
        for m in docs:
            m_serialized = serialize_document(m)
            raw_uid = m.get("user_id")
            uid_str = str(raw_uid) if raw_uid else ""
            
            u_doc = None
            if uid_str:
                u_doc = user_repository.get_by_id(uid_str)
                if not u_doc and ObjectId.is_valid(uid_str):
                    u_doc = users_collection.find_one({"_id": ObjectId(uid_str)})
                if not u_doc:
                    u_doc = users_collection.find_one({"_id": uid_str})

            u_info = u_doc or {}
            user_name = u_info.get("name") or m_serialized.get("user_name") or m_serialized.get("name") or ""
            user_email = u_info.get("email") or m_serialized.get("user_email") or m_serialized.get("email") or ""
            
            m_serialized["name"] = user_name
            m_serialized["email"] = user_email
            m_serialized["user_name"] = user_name
            m_serialized["user_email"] = user_email
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
