"""
constants.py
--------------
Centralized enums and constants for the INFOSYS platform.
Every status, role, and pipeline step is defined here so that
all layers (models, services, APIs) share a single source of truth.
"""

from __future__ import annotations

from enum import Enum


# ──────────────────────────────────────────────
# User & Workspace
# ──────────────────────────────────────────────

class UserRole(str, Enum):
    """Roles a user can hold within a workspace."""
    PM = "pm"
    MEMBER = "member"


class WorkspaceStatus(str, Enum):
    """Lifecycle states for a workspace."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class MemberStatus(str, Enum):
    """Membership states within a workspace."""
    ACTIVE = "active"
    INVITED = "invited"
    REMOVED = "removed"


# ──────────────────────────────────────────────
# Data Pipeline
# ──────────────────────────────────────────────

class FileFormat(str, Enum):
    """Supported file upload formats."""
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"


class SourceType(str, Enum):
    """Types of customer data sources."""
    FEEDBACK = "feedback"
    REVIEW = "review"
    SUPPORT_TICKET = "support_ticket"


class DatasetStatus(str, Enum):
    """Lifecycle states for a dataset moving through the pipeline."""
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    INGESTING = "ingesting"
    INGESTED = "ingested"
    VALIDATING = "validating"
    VALIDATED = "validated"
    CLEANING = "cleaning"
    CLEANED = "cleaned"
    PREPROCESSING = "preprocessing"
    PREPROCESSED = "preprocessed"
    READY = "ready"
    FAILED = "failed"


class ValidationStatus(str, Enum):
    """Result of validating a single record."""
    VALID = "valid"
    INVALID = "invalid"
    WARNING = "warning"


# ──────────────────────────────────────────────
# Processing Jobs
# ──────────────────────────────────────────────

class JobStatus(str, Enum):
    """States for a background processing job."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobStep(str, Enum):
    """Individual steps within a processing job."""
    INGESTION = "ingestion"
    VALIDATION = "validation"
    CLEANING = "cleaning"
    PREPROCESSING = "preprocessing"


# ──────────────────────────────────────────────
# Workflow Tracking
# ──────────────────────────────────────────────

class WorkflowStep(str, Enum):
    """High-level steps in the product intelligence workflow."""
    AUTH = "auth"
    WORKSPACE = "workspace"
    PRODUCT = "product"
    UPLOAD = "upload"
    INGESTION = "ingestion"
    VALIDATION = "validation"
    CLEANING = "cleaning"
    NORMALIZATION = "normalization"
    PREPROCESSING = "preprocessing"
    AI_ANALYSIS = "ai_analysis"


class WorkflowStepStatus(str, Enum):
    """Status of a single workflow step."""
    NOT_STARTED = "not_started"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"


# ──────────────────────────────────────────────
# Permissions
# ──────────────────────────────────────────────

class Permission(str, Enum):
    """Actions that can be permitted or denied per role."""
    # Workspace
    CREATE_WORKSPACE = "create_workspace"
    VIEW_WORKSPACE = "view_workspace"
    UPDATE_WORKSPACE = "update_workspace"
    DELETE_WORKSPACE = "delete_workspace"
    MANAGE_MEMBERS = "manage_members"

    # Product
    CREATE_PRODUCT = "create_product"
    VIEW_PRODUCT = "view_product"
    UPDATE_PRODUCT = "update_product"

    # Data
    UPLOAD_DATASET = "upload_dataset"
    VIEW_DATASET = "view_dataset"
    DELETE_DATASET = "delete_dataset"
    RUN_PIPELINE = "run_pipeline"

    # Intelligence (Milestone 2+)
    VIEW_INTELLIGENCE = "view_intelligence"

    # PM (Milestone 3+)
    GENERATE_PRD = "generate_prd"
    ASSIGN_TASKS = "assign_tasks"
    VALIDATE_PLAN = "validate_plan"

    # Tasks
    COMPLETE_TASK = "complete_task"
    VIEW_TASKS = "view_tasks"


# ──────────────────────────────────────────────
# Application Constants
# ──────────────────────────────────────────────

MAX_FILE_SIZE_MB: int = 50
MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_EXTENSIONS: set[str] = {".csv", ".json", ".xlsx"}

REQUIRED_FEEDBACK_FIELDS: list[str] = [
    "customer_id", "rating", "feedback", "date"
]

REQUIRED_REVIEW_FIELDS: list[str] = [
    "review_id", "product_id", "rating", "review_text", "date"
]

REQUIRED_TICKET_FIELDS: list[str] = [
    "ticket_id", "customer_id", "subject", "description", "date"
]

# Maps source type → required fields
SOURCE_TYPE_REQUIRED_FIELDS: dict[str, list[str]] = {
    SourceType.FEEDBACK: REQUIRED_FEEDBACK_FIELDS,
    SourceType.REVIEW: REQUIRED_REVIEW_FIELDS,
    SourceType.SUPPORT_TICKET: REQUIRED_TICKET_FIELDS,
}

# Rating constraints
MIN_RATING: int = 1
MAX_RATING: int = 5

# Pagination
DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 100
