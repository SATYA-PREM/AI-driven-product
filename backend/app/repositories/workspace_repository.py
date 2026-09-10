from app.repositories.base_repository import BaseRepository
from app.core.database import workspaces_collection, workspace_members_collection
from bson import ObjectId

class WorkspaceRepository(BaseRepository):
    """Repository for workspace-related MongoDB operations."""

    def __init__(self):
        super().__init__(workspaces_collection)

    def find_by_owner(self, owner_id: str) -> list[dict]:
        """Find all workspaces owned by a specific user."""
        return self.find_many({"owner_id": owner_id})

    def find_user_workspaces(self, user_id: str, member_collection=workspace_members_collection) -> list[dict]:
        """Find all workspaces where the user is a member."""
        memberships = list(member_collection.find({"user_id": user_id}))
        workspace_ids = [m["workspace_id"] for m in memberships]
        
        object_ids = []
        for wid in workspace_ids:
            if ObjectId.is_valid(wid):
                object_ids.append(ObjectId(wid))
        
        return list(self.collection.find({"_id": {"$in": object_ids}}))

workspace_repository = WorkspaceRepository()
