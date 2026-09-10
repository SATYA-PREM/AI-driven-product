from __future__ import annotations

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordService:
    """Service for handling password hashing and validation."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plaintext password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        """Verify a plaintext password against a hashed password."""
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, list[str]]:
        """
        Validate password strength.
        Returns a tuple of (is_valid, list_of_errors).
        """
        errors = []
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one digit.")
        if not any(char.isupper() for char in password):
            errors.append("Password must contain at least one uppercase letter.")
        
        return len(errors) == 0, errors

password_service = PasswordService()
