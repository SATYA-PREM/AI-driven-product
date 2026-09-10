from app.repositories.base_repository import BaseRepository
from app.core.database import users_collection


class UserRepository(BaseRepository):
    """Repository for user-related MongoDB operations."""

    def __init__(self):
        super().__init__(users_collection)

    def find_by_email(self, email: str) -> dict | None:
        """Find a user by their email address."""
        return self.find_one({"email": email})

    # Alias for get_by_email
    get_by_email = find_by_email

    def update_role(self, user_id: str, role: str) -> bool:
        """Update a user's role."""
        return self.update(user_id, {"role": role})

    def find_active_users(self, skip: int = 0, limit: int = 20) -> list[dict]:
        """Find all active users."""
        return self.find_many({"is_active": True}, skip=skip, limit=limit)


user_repository = UserRepository()
