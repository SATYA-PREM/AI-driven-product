"""
transitions.py
--------------
Defines and enforces state machine transitions for the product intelligence workflow.
Prevents stage-jumping and guarantees the strict linear progression:
UPLOAD → VALIDATE → CLEAN → PREPROCESS → AGENT 1 → AGENT 2 → AGENT 3 → AGGREGATE → INTELLIGENCE → REPORT
"""

from __future__ import annotations
from typing import Any
from app.workflow.states import WorkflowState
from app.core.exceptions import WorkflowTransitionError

# Chronological order of user-visible pipeline milestones
MASTER_PIPELINE_SEQUENCE: list[WorkflowState] = [
    WorkflowState.CREATED,
    WorkflowState.VALIDATING,
    WorkflowState.VALIDATED,
    WorkflowState.CLEANING,
    WorkflowState.CLEANED,
    WorkflowState.PREPROCESSING,
    WorkflowState.PREPROCESSED,
    WorkflowState.AI_ANALYSIS,
    WorkflowState.AGENT_1_COMPLETED,
    WorkflowState.AGENT_2_COMPLETED,
    WorkflowState.AGENT_3_COMPLETED,
    WorkflowState.AGGREGATING,
    WorkflowState.INTELLIGENCE_READY,
    WorkflowState.REPORT_READY,
    WorkflowState.COMPLETED,
]

# Canonical transition rules
ALLOWED_TRANSITIONS: dict[WorkflowState, list[WorkflowState]] = {
    WorkflowState.CREATED: [WorkflowState.VALIDATING, WorkflowState.FAILED],
    WorkflowState.UPLOADED: [WorkflowState.VALIDATING, WorkflowState.FAILED],
    WorkflowState.VALIDATING: [WorkflowState.VALIDATED, WorkflowState.FAILED],
    WorkflowState.VALIDATED: [WorkflowState.CLEANING, WorkflowState.VALIDATING, WorkflowState.FAILED],
    WorkflowState.CLEANING: [WorkflowState.CLEANED, WorkflowState.FAILED],
    WorkflowState.CLEANED: [WorkflowState.PREPROCESSING, WorkflowState.CLEANING, WorkflowState.FAILED],
    WorkflowState.PREPROCESSING: [WorkflowState.PREPROCESSED, WorkflowState.FAILED],
    WorkflowState.PREPROCESSED: [WorkflowState.AI_ANALYSIS, WorkflowState.PREPROCESSING, WorkflowState.FAILED],
    WorkflowState.AI_ANALYSIS: [WorkflowState.AGENT_1_COMPLETED, WorkflowState.FAILED],
    WorkflowState.AGENT_1_COMPLETED: [WorkflowState.AGENT_2_COMPLETED, WorkflowState.FAILED],
    WorkflowState.AGENT_2_COMPLETED: [WorkflowState.AGENT_3_COMPLETED, WorkflowState.FAILED],
    WorkflowState.AGENT_3_COMPLETED: [WorkflowState.AGGREGATING, WorkflowState.FAILED],
    WorkflowState.AGGREGATING: [WorkflowState.INTELLIGENCE_READY, WorkflowState.FAILED],
    WorkflowState.INTELLIGENCE_READY: [WorkflowState.REPORT_READY, WorkflowState.COMPLETED, WorkflowState.FAILED],
    WorkflowState.REPORT_READY: [WorkflowState.COMPLETED, WorkflowState.FAILED],
    WorkflowState.COMPLETED: [WorkflowState.AI_ANALYSIS],  # Allow rerun
    WorkflowState.FAILED: [
        WorkflowState.VALIDATING,
        WorkflowState.CLEANING,
        WorkflowState.PREPROCESSING,
        WorkflowState.AI_ANALYSIS,
    ],
}


def can_transition(from_state: str | WorkflowState, to_state: str | WorkflowState) -> bool:
    """Check if transitioning from from_state to to_state is permissible."""
    curr = WorkflowState.normalize(from_state)
    target = WorkflowState.normalize(to_state)
    if curr == target:
        return True
    return target in ALLOWED_TRANSITIONS.get(curr, [])


def require_dataset_stage(
    dataset: dict[str, Any],
    required_states: WorkflowState | list[WorkflowState],
    operation_name: str,
) -> None:
    """
    Assert that a dataset is in the required prerequisite stage before executing an operation.
    Raises WorkflowTransitionError (HTTP 400) if an illegal stage-jump is detected.
    """
    if not isinstance(required_states, list):
        required_states = [required_states]

    current_raw = dataset.get("status")
    current_state = WorkflowState.normalize(current_raw)

    # Normalize required states
    normalized_allowed = [WorkflowState.normalize(s) for s in required_states]

    # Special allowance: CREATED and UPLOADED are equivalent
    if WorkflowState.CREATED in normalized_allowed and WorkflowState.UPLOADED not in normalized_allowed:
        normalized_allowed.append(WorkflowState.UPLOADED)
    if WorkflowState.UPLOADED in normalized_allowed and WorkflowState.CREATED not in normalized_allowed:
        normalized_allowed.append(WorkflowState.CREATED)

    if current_state not in normalized_allowed:
        dataset_id = str(dataset.get("dataset_id") or dataset.get("_id") or "UNKNOWN")
        allowed_str = " or ".join([s.value for s in required_states])
        msg = (
            f"Cannot execute '{operation_name}' on dataset '{dataset_id}' with status '{current_state.value}'. "
            f"Required prerequisite status is '{allowed_str}'. "
            f"Pipeline master sequence: UPLOAD → VALIDATE → CLEAN → PREPROCESS → AI_ANALYSIS → INTELLIGENCE → REPORT."
        )
        raise WorkflowTransitionError(
            message=msg,
            current_state=current_state.value,
            required_state=allowed_str,
            allowed_sequence=[s.value for s in MASTER_PIPELINE_SEQUENCE],
        )


def get_pipeline_progress(current_state: str | WorkflowState) -> dict[str, Any]:
    """
    Returns a visual step-by-step progress dictionary for frontend PM dashboards.
    """
    current = WorkflowState.normalize(current_state)

    state_order = {
        WorkflowState.CREATED: 0,
        WorkflowState.UPLOADED: 1,
        WorkflowState.VALIDATING: 2,
        WorkflowState.VALIDATED: 3,
        WorkflowState.CLEANING: 4,
        WorkflowState.CLEANED: 5,
        WorkflowState.PREPROCESSING: 6,
        WorkflowState.PREPROCESSED: 7,
        WorkflowState.AI_ANALYSIS: 8,
        WorkflowState.AGENT_1_COMPLETED: 9,
        WorkflowState.AGENT_2_COMPLETED: 10,
        WorkflowState.AGENT_3_COMPLETED: 11,
        WorkflowState.AGGREGATING: 12,
        WorkflowState.INTELLIGENCE_READY: 13,
        WorkflowState.REPORT_READY: 14,
        WorkflowState.COMPLETED: 15,
        WorkflowState.FAILED: -1,
    }

    milestones = [
        {"name": "Upload", "state": WorkflowState.UPLOADED.value, "done_idx": 1},
        {"name": "Validation", "state": WorkflowState.VALIDATED.value, "done_idx": 3},
        {"name": "Cleaning", "state": WorkflowState.CLEANED.value, "done_idx": 5},
        {"name": "Preprocessing", "state": WorkflowState.PREPROCESSED.value, "done_idx": 7},
        {"name": "AI Analysis", "state": WorkflowState.AI_ANALYSIS.value, "done_idx": 11},
        {"name": "Intelligence", "state": WorkflowState.INTELLIGENCE_READY.value, "done_idx": 13},
        {"name": "Report", "state": WorkflowState.COMPLETED.value, "done_idx": 15},
    ]

    curr_idx = state_order.get(current, 0)

    formatted_stages = []
    found_current = False
    for m in milestones:
        done_idx = m["done_idx"]
        if current == WorkflowState.FAILED:
            status = "failed"
        elif curr_idx >= done_idx:
            status = "completed"
        elif not found_current:
            status = "current"
            found_current = True
        else:
            status = "pending"

        formatted_stages.append({
            "name": m["name"],
            "state": m["state"],
            "status": status,
        })

    return {
        "current_state": current.value,
        "is_failed": current == WorkflowState.FAILED,
        "stages": formatted_stages,
    }
