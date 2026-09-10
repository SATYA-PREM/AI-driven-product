from __future__ import annotations
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from app.core.config import settings


class TokenService:
    """Service for managing JWT access tokens."""

    @staticmethod
    def create_access_token(user_id: str, email: str, role: str) -> str:
        """Create a new JWT access token."""
        to_encode = {
            "sub": str(user_id),
            "email": email,
            "role": role
        }
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})

        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> dict | None:
        """Decode and validate a JWT access token."""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None


token_service = TokenService()
