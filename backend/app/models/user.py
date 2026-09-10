from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.constants import UserRole


class UserModel:
    """Model for user collection."""

    @staticmethod
    def create_document(
        name: str,
        email: str,
        password_hash: str = "",
        hashed_password: str = "",
        role: UserRole | str = UserRole.MEMBER,
        is_active: bool = True
    ) -> Dict[str, Any]:
        """Create a new user document for MongoDB."""
        now = datetime.now(timezone.utc)
        pwd = password_hash or hashed_password
        role_val = role.value if hasattr(role, "value") else str(role)
        return {
            "name": name,
            "email": email,
            "password_hash": pwd,
            "hashed_password": pwd,
            "role": role_val,
            "is_active": is_active,
            "created_at": now,
            "updated_at": now
        }