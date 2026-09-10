from __future__ import annotations

from app.repositories.user_repository import user_repository
from app.models.user import UserModel
from app.core.exceptions import DuplicateError, AuthenticationError, NotFoundError
from app.services.auth.password_service import password_service
from app.services.auth.token_service import token_service
from app.utils.serialization import serialize_document


class AuthService:
    """Service for handling high-level authentication flows."""

    @staticmethod
    def register(name: str, email: str, password: str, role: str = "member") -> dict:
        """Register a new user."""
        if user_repository.find_by_email(email):
            raise DuplicateError("User", f"email '{email}'")

        is_valid, errors = password_service.validate_password_strength(password)
        if not is_valid:
            raise AuthenticationError(f"Weak password: {', '.join(errors)}")

        hashed_password = password_service.hash_password(password)
        user_doc = UserModel.create_document(
            name=name,
            email=email,
            password_hash=hashed_password,
            hashed_password=hashed_password,
            role=role
        )
        user_id = user_repository.create(user_doc)
        user_doc["_id"] = user_id

        token = token_service.create_access_token(str(user_id), email, role)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_document(user_doc)
        }

    @staticmethod
    def login(email: str, password: str) -> dict:
        """Authenticate a user and return a token."""
        user_doc = user_repository.find_by_email(email)
        if not user_doc:
            raise AuthenticationError("Invalid email or password.")

        pwd_hash = user_doc.get("password_hash") or user_doc.get("hashed_password") or ""
        if not password_service.verify_password(password, pwd_hash):
            raise AuthenticationError("Invalid email or password.")

        user_id = str(user_doc["_id"])
        role = user_doc.get("role", "member")
        token = token_service.create_access_token(user_id, email, role)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_document(user_doc)
        }

    @staticmethod
    def get_user_by_id(user_id: str) -> dict | None:
        """Retrieve user details by ID."""
        user_doc = user_repository.get_by_id(user_id)
        if not user_doc:
            raise NotFoundError("User", user_id)
        return serialize_document(user_doc)


auth_service = AuthService()