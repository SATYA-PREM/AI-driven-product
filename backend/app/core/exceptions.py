"""
exceptions.py
--------------
Application exception hierarchy.

All custom exceptions extend AppException. The error_middleware
catches these and maps them to the correct HTTP status codes
so that services/repositories never need to import FastAPI's
HTTPException directly.
"""

from __future__ import annotations


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = 500,
        details: dict | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


# ──────────────────────────────────────────────
# Authentication & Authorization
# ──────────────────────────────────────────────

class AuthenticationError(AppException):
    """Raised when authentication fails (invalid credentials, expired token)."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401)


class AuthorizationError(AppException):
    """Raised when user lacks permission for the requested action."""

    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message=message, status_code=403)


# ──────────────────────────────────────────────
# Resource Errors
# ──────────────────────────────────────────────

class NotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} '{resource_id}' not found"
        super().__init__(message=message, status_code=404)


class DuplicateError(AppException):
    """Raised when a resource already exists (unique constraint violation)."""

    def __init__(self, resource: str = "Resource", field: str = ""):
        message = f"{resource} already exists"
        if field:
            message = f"{resource} with this {field} already exists"
        super().__init__(message=message, status_code=409)


# ──────────────────────────────────────────────
# Validation Errors
# ──────────────────────────────────────────────

class ValidationError(AppException):
    """Raised when input data fails validation."""

    def __init__(self, message: str = "Validation failed", errors: list[dict] | None = None):
        super().__init__(
            message=message,
            status_code=422,
            details={"errors": errors or []},
        )


# ──────────────────────────────────────────────
# File & Pipeline Errors
# ──────────────────────────────────────────────

class FileProcessingError(AppException):
    """Raised when file upload or parsing fails."""

    def __init__(self, message: str = "File processing failed"):
        super().__init__(message=message, status_code=400)


class PipelineError(AppException):
    """Raised when a data pipeline step fails."""

    def __init__(self, step: str = "", message: str = "Pipeline step failed"):
        details = {"step": step} if step else {}
        super().__init__(message=message, status_code=500, details=details)


class JobError(AppException):
    """Raised when a processing job encounters an error."""

    def __init__(self, job_id: str = "", message: str = "Job processing failed"):
        details = {"job_id": job_id} if job_id else {}
        super().__init__(message=message, status_code=500, details=details)


# ──────────────────────────────────────────────
# Rate Limiting
# ──────────────────────────────────────────────

class RateLimitError(AppException):
    """Raised when the request rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(message=message, status_code=429)
