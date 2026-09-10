from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.constants import UserRole, MemberStatus


class WorkspaceMemberModel:
    """Model for workspace member collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        user_id: str,
        role: UserRole | str = UserRole.MEMBER,
        permissions: Optional[List[str]] = None,
        status: MemberStatus | str = MemberStatus.ACTIVE,
        added_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new workspace member document for MongoDB."""
        role_val = role.value if hasattr(role, "value") else str(role)
        status_val = status.value if hasattr(status, "value") else str(status)
        return {
            "workspace_id": workspace_id,
            "user_id": user_id,
            "role": role_val,
            "permissions": permissions or [],
            "status": status_val,
            "added_by": added_by,
            "joined_at": datetime.now(timezone.utc)
        }
