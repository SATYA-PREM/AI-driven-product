from __future__ import annotations

from bson import ObjectId
from app.repositories.workspace_repository import workspace_repository
from app.models.workspace import WorkspaceModel
from app.models.workspace_member import WorkspaceMemberModel
from app.core.database import workspace_members_collection
from app.core.exceptions import NotFoundError
from app.core.constants import WorkspaceStatus, UserRole
from app.utils.serialization import serialize_document


class WorkspaceService:
    """Service for handling workspace CRUD operations."""

    @staticmethod
    def create_workspace(name: str, description: str, owner_id: str) -> dict:
        """Create a new workspace and automatically add the creator as PM."""
        workspace_doc = WorkspaceModel.create_document(
            name=name,
            description=description,
            owner_id=owner_id,
            created_by=owner_id
        )
        workspace_id = workspace_repository.create(workspace_doc)
        workspace_doc["_id"] = workspace_id

        member_doc = WorkspaceMemberModel.create_document(
            workspace_id=str(workspace_id),
            user_id=owner_id,
            role=UserRole.PM.value,
            added_by=owner_id
        )

        if ObjectId.is_valid(workspace_id):
            member_doc["workspace_id"] = ObjectId(workspace_id)
        if ObjectId.is_valid(owner_id):
            member_doc["user_id"] = ObjectId(owner_id)
            member_doc["added_by"] = ObjectId(owner_id)

        workspace_members_collection.insert_one(member_doc)
        return serialize_document(workspace_doc)

    @staticmethod
    def get_workspace(workspace_id: str) -> dict:
        """Get a workspace by ID."""
        workspace = workspace_repository.get_by_id(workspace_id)
        if not workspace or workspace.get("status") == WorkspaceStatus.DELETED.value:
            raise NotFoundError("Workspace", workspace_id)
        return serialize_document(workspace)

    @staticmethod
    def list_user_workspaces(user_id: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """List all workspaces a user is a member of."""
        u_query = {"user_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"user_id": user_id}
        member_docs = list(workspace_members_collection.find(u_query))
        
        raw_ids = [m.get("workspace_id") for m in member_docs if m.get("workspace_id")]
        query_ids = []
        for wid in raw_ids:
            if isinstance(wid, ObjectId):
                query_ids.append(wid)
            elif ObjectId.is_valid(str(wid)):
                query_ids.append(ObjectId(str(wid)))

        workspaces = workspace_repository.find(
            {
                "_id": {"$in": query_ids},
                "status": {"$ne": WorkspaceStatus.DELETED.value}
            },
            skip=skip,
            limit=limit
        )
        return [serialize_document(w) for w in workspaces]

    @staticmethod
    def update_workspace(workspace_id: str, update_data: dict) -> dict:
        """Update workspace details."""
        success = workspace_repository.update(workspace_id, update_data)
        if not success:
            raise NotFoundError("Workspace", workspace_id)
        return WorkspaceService.get_workspace(workspace_id)

    @staticmethod
    def delete_workspace(workspace_id: str) -> bool:
        """Soft delete a workspace by updating its status."""
        success = workspace_repository.update(
            workspace_id,
            {"status": WorkspaceStatus.DELETED.value}
        )
        if not success:
            raise NotFoundError("Workspace", workspace_id)
        return True


workspace_service = WorkspaceService()
