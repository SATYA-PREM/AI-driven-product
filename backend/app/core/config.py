"""
config.py
-----------
Application configuration loaded from environment variables via Pydantic.
Single source of truth for all settings.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ── Application ──────────────────────────────
    APP_NAME: str = "Product Intelligence API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── MongoDB ──────────────────────────────────
    MONGODB_URL: str
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "product_intelligence"

    # ── JWT ───────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── CORS ──────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── File Uploads ──────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_EXTENSIONS: str = ".csv,.json,.xlsx"

    # ── Gemini AI (Milestone 2, optional for now) ─
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse CORS_ORIGINS comma-separated string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        """Maximum upload size in bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def allowed_extensions_set(self) -> set[str]:
        """Parse allowed file extensions into a set."""
        return {ext.strip() for ext in self.ALLOWED_FILE_EXTENSIONS.split(",") if ext.strip()}

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()