from __future__ import annotations

from bson import ObjectId
from app.repositories.workspace_repository import workspace_repository
from app.models.workspace import WorkspaceModel
from app.models.workspace_member import WorkspaceMemberModel
from app.core.database import workspace_members_collection
from app.core.exceptions import NotFoundError
from app.core.constants import WorkspaceStatus, UserRole
from app.services.workspace.activity_service import activity_service
from app.utils.serialization import serialize_document


class WorkspaceService:
    """Service for handling workspace CRUD operations."""

    @staticmethod
    def _count_members(workspace_id: str | ObjectId) -> int:
        ws_id_str = str(workspace_id)
        queries = [{"workspace_id": ws_id_str}]
        if ObjectId.is_valid(ws_id_str):
            queries.append({"workspace_id": ObjectId(ws_id_str)})
        return workspace_members_collection.count_documents({"$or": queries})

    @staticmethod
    def create_workspace(name: str, description: str, owner_id: str, settings: dict | None = None) -> dict:
        """Create a new workspace and automatically add the creator as PM."""
        workspace_doc = WorkspaceModel.create_document(
            name=name,
            description=description,
            owner_id=owner_id,
            created_by=owner_id,
            settings=settings or {}
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

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="workspace_created",
            title=f'Workspace "{name}" created',
            description="Workspace initialized with default configuration",
            user_id=owner_id,
        )

        # Auto-create default product record
        prod_name = (settings.get("product_name") if settings else None) or name
        prod_cat = (settings.get("industry") if settings else None) or "General"
        try:
            from app.services.product.product_service import product_service
            product_service.create_product(
                workspace_id=str(workspace_id),
                name=prod_name,
                description=description or f"Primary product for {name}",
                category=prod_cat,
                created_by=owner_id
            )
        except Exception:
            pass

        serialized = serialize_document(workspace_doc)
        serialized["members_count"] = 1
        return serialized

    @staticmethod
    def get_workspace(workspace_id: str) -> dict:
        """Get a workspace by ID."""
        workspace = workspace_repository.get_by_id(workspace_id)
        if not workspace or workspace.get("status") == WorkspaceStatus.DELETED.value:
            raise NotFoundError("Workspace", workspace_id)
        serialized = serialize_document(workspace)
        serialized["members_count"] = WorkspaceService._count_members(workspace_id)
        return serialized

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
        results = []
        for w in workspaces:
            s = serialize_document(w)
            s["members_count"] = WorkspaceService._count_members(w["_id"])
            results.append(s)
        return results

    @staticmethod
    def update_workspace(workspace_id: str, update_data: dict) -> dict:
        """Update workspace details."""
        success = workspace_repository.update(workspace_id, update_data)
        if not success:
            raise NotFoundError("Workspace", workspace_id)

        activity_service.log_activity(
            workspace_id=workspace_id,
            action="workspace_updated",
            title="Workspace settings updated",
            description="Configuration and metadata were modified",
        )

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
