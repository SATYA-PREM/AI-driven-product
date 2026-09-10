"""
constants.py (utils)
---------------------
Application-level string constants and magic values
that don't fit in the core/constants.py enums.
"""

from __future__ import annotations

# ──────────────────────────────────────────────
# API versioning
# ──────────────────────────────────────────────
API_V1_PREFIX: str = "/api/v1"

# ──────────────────────────────────────────────
# HTTP Headers
# ──────────────────────────────────────────────
REQUEST_ID_HEADER: str = "X-Request-ID"

# ──────────────────────────────────────────────
# Default messages
# ──────────────────────────────────────────────
MSG_SUCCESS: str = "Operation completed successfully"
MSG_CREATED: str = "Resource created successfully"
MSG_UPDATED: str = "Resource updated successfully"
MSG_DELETED: str = "Resource deleted successfully"
MSG_NOT_FOUND: str = "Resource not found"
MSG_UNAUTHORIZED: str = "Authentication required"
MSG_FORBIDDEN: str = "Insufficient permissions"

# ──────────────────────────────────────────────
# Collection names (for reference)
# ──────────────────────────────────────────────
COLLECTION_USERS: str = "users"
COLLECTION_WORKSPACES: str = "workspaces"
COLLECTION_WORKSPACE_MEMBERS: str = "workspace_members"
COLLECTION_PRODUCTS: str = "products"
COLLECTION_DATASETS: str = "datasets"
COLLECTION_RAW_DATA: str = "raw_data"
COLLECTION_VALIDATION_RESULTS: str = "validation_results"
COLLECTION_CLEANED_DATA: str = "cleaned_data"
COLLECTION_PROCESSED_DATA: str = "processed_data"
COLLECTION_PROCESSING_JOBS: str = "processing_jobs"
COLLECTION_WORKFLOWS: str = "workflows"
