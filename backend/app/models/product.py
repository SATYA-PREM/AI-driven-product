from datetime import datetime, timezone
from typing import Dict, Any

class ProductModel:
    """Model for product collection."""

    @staticmethod
    def create_document(
        workspace_id: str,
        name: str,
        description: str,
        created_by: str,
        category: str = "",
        status: str = "active"
    ) -> Dict[str, Any]:
        """Create a new product document for MongoDB."""
        now = datetime.now(timezone.utc)
        return {
            "workspace_id": workspace_id,
            "name": name,
            "description": description,
            "category": category,
            "status": status,
            "created_by": created_by,
            "created_at": now,
            "updated_at": now
        }
