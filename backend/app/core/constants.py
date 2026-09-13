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
    AGENT_1 = "agent_1"
    AGENT_2 = "agent_2"
    AGENT_3 = "agent_3"
    INTELLIGENCE = "intelligence"
    REPORT = "report"


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


# ──────────────────────────────────────────────
# Milestone 2: AI & Product Intelligence Constants
# ──────────────────────────────────────────────

class SentimentType(str, Enum):
    """Customer sentiment classification."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class IntentType(str, Enum):
    """Reason the customer submitted feedback."""
    COMPLAINT = "complaint"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    QUESTION = "question"
    PRAISE = "praise"
    GENERAL_FEEDBACK = "general_feedback"


class AnalysisStatus(str, Enum):
    """Lifecycle status for individual record AI analysis."""
    PENDING = "pending"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    LOW_CONFIDENCE = "low_confidence"
    FAILED = "failed"
    RETRYING = "retrying"


class TrendDirection(str, Enum):
    """Direction of pattern changes over time."""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    NEW = "new"
    EMERGING = "emerging"
    DECLINING = "declining"


class ClusterType(str, Enum):
    """Type of semantic cluster."""
    ISSUE = "issue"
    FEATURE = "feature"


class SeverityLevel(str, Enum):
    """Severity of a product problem."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PriorityLevel(str, Enum):
    """Priority level for product intelligence."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InsightType(str, Enum):
    """Allowed taxonomy of product intelligence insights."""
    HIGH_PRIORITY_ISSUE = "HIGH_PRIORITY_ISSUE"
    EMERGING_ISSUE = "EMERGING_ISSUE"
    RECURRING_ISSUE = "RECURRING_ISSUE"
    PRODUCT_OPPORTUNITY = "PRODUCT_OPPORTUNITY"
    HIGH_DEMAND_FEATURE = "HIGH_DEMAND_FEATURE"
    NEGATIVE_TREND = "NEGATIVE_TREND"
    POSITIVE_TREND = "POSITIVE_TREND"
    CUSTOMER_EXPERIENCE_RISK = "CUSTOMER_EXPERIENCE_RISK"


class AIJobStatus(str, Enum):
    """Overall status of an AI analysis job."""
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"


class AgentExecutionStatus(str, Enum):
    """Status of an individual agent within an AI job."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


# Standard taxonomy of product themes
DEFAULT_PRODUCT_THEMES: list[str] = [
    "authentication",
    "checkout",
    "payment",
    "dashboard",
    "search",
    "reporting",
    "notifications",
    "billing",
    "permissions",
    "onboarding",
    "integrations",
    "analytics",
    "tasks",
    "performance",
    "ai_assistant",
    "workspace",
]

# Configurable clustering & threshold limits
MIN_CLUSTER_SIZE: int = 3
EMERGING_THRESHOLD: int = 5
HIGH_FREQUENCY_THRESHOLD: int = 10
LOW_CONFIDENCE_THRESHOLD: float = 0.60

