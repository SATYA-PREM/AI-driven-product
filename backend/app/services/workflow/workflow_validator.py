from __future__ import annotations
from app.core.constants import WorkflowStepStatus, WorkflowStep
from app.services.workflow.workflow_state import can_transition
from app.services.workflow.dependency_service import is_step_ready


class WorkflowValidator:
    """Validates step transitions and ensures dependencies are satisfied."""

    def validate_step_transition(self, workflow: dict, step_name: str, target_status: str) -> tuple[bool, str]:
        steps = workflow.get("steps", [])
        
        # Handle both list of step dicts and dict of step dicts
        current_step_dict = None
        if isinstance(steps, list):
            for s in steps:
                if s.get("name") == step_name:
                    current_step_dict = s
                    break
        elif isinstance(steps, dict):
            current_step_dict = steps.get(step_name)

        if not current_step_dict:
            return False, f"Step '{step_name}' not found in workflow"

        current_status_val = current_step_dict.get("status", WorkflowStepStatus.NOT_STARTED.value)
        try:
            current_status = WorkflowStepStatus(current_status_val)
            target_stat = WorkflowStepStatus(target_status)
        except ValueError:
            return False, f"Invalid status value: {target_status}"

        if not can_transition(current_status, target_stat):
            return False, f"Cannot transition from {current_status.value} to {target_status}"

        return True, ""


workflow_validator = WorkflowValidator()
validate_step_transition = workflow_validator.validate_step_transition
