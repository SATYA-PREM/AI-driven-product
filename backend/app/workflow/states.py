"""
states.py
---------
Single source of truth for all workflow lifecycle states across the platform.

The master sequence is strictly linear:
CREATED (or UPLOADED)
    ↓
VALIDATING
    ↓
VALIDATED
    ↓
CLEANING
    ↓
CLEANED
    ↓
PREPROCESSING
    ↓
PREPROCESSED
    ↓
AI_ANALYSIS
    ↓
AGENT_1_COMPLETED
    ↓
AGENT_2_COMPLETED
    ↓
AGENT_3_COMPLETED
    ↓
AGGREGATING
    ↓
INTELLIGENCE_READY
    ↓
REPORT_READY
    ↓
COMPLETED

Any active state may transition to:
    ↓
FAILED
"""

from __future__ import annotations
from enum import Enum


class WorkflowState(str, Enum):
    """Canonical workflow states for datasets and execution jobs."""
    CREATED = "CREATED"
    UPLOADED = "UPLOADED"  # Alias for initial dataset ingestion
    VALIDATING = "VALIDATING"
    VALIDATED = "VALIDATED"
    CLEANING = "CLEANING"
    CLEANED = "CLEANED"
    PREPROCESSING = "PREPROCESSING"
    PREPROCESSED = "PREPROCESSED"
    AI_ANALYSIS = "AI_ANALYSIS"
    AGENT_1_COMPLETED = "AGENT_1_COMPLETED"
    AGENT_2_COMPLETED = "AGENT_2_COMPLETED"
    AGENT_3_COMPLETED = "AGENT_3_COMPLETED"
    AGGREGATING = "AGGREGATING"
    INTELLIGENCE_READY = "INTELLIGENCE_READY"
    REPORT_READY = "REPORT_READY"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

    @classmethod
    def normalize(cls, val: str | WorkflowState | None) -> WorkflowState:
        """Normalize case and aliases to canonical WorkflowState enum."""
        if val is None:
            return cls.CREATED
        if isinstance(val, cls):
            return val
        s = str(val).strip().upper()
        if s == "INGESTED" or s == "UPLOADING":
            return cls.UPLOADED
        if s == "READY":
            return cls.PREPROCESSED
        try:
            return cls(s)
        except ValueError:
            # Fallback to CREATED if unrecognized
            return cls.CREATED

