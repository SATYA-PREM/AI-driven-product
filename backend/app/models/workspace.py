from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.constants import WorkspaceStatus


class WorkspaceModel:
    """Model for workspace collection."""

    @staticmethod
    def create_document(
        name: str,
        description: str = "",
        owner_id: str = "",
        created_by: str = "",
        status: WorkspaceStatus | str = WorkspaceStatus.ACTIVE,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new workspace document for MongoDB."""
        now = datetime.now(timezone.utc)
        owner = owner_id or created_by
        status_val = status.value if hasattr(status, "value") else str(status)
        return {
            "name": name,
            "description": description,
            "owner_id": owner,
            "created_by": owner,
            "status": status_val,
            "settings": settings or {},
            "created_at": now,
            "updated_at": now
        }
