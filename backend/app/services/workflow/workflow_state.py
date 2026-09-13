from __future__ import annotations
from app.core.constants import WorkflowStepStatus, WorkflowStep

VALID_TRANSITIONS = {
    WorkflowStepStatus.NOT_STARTED: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS],
    WorkflowStepStatus.READY: [WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.BLOCKED],
    WorkflowStepStatus.IN_PROGRESS: [WorkflowStepStatus.COMPLETED, WorkflowStepStatus.FAILED, WorkflowStepStatus.BLOCKED],
    WorkflowStepStatus.FAILED: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS],
    WorkflowStepStatus.BLOCKED: [WorkflowStepStatus.READY, WorkflowStepStatus.NOT_STARTED],
    WorkflowStepStatus.COMPLETED: []
}


class WorkflowStateMachine:
    """State machine governing allowed transitions between workflow statuses."""

    def can_transition(self, current: WorkflowStepStatus, target: WorkflowStepStatus) -> bool:
        if current == target:
            return True
        return target in VALID_TRANSITIONS.get(current, [])

    def get_step_order(self) -> list[WorkflowStep]:
        return [
            WorkflowStep.AUTH,
            WorkflowStep.WORKSPACE,
            WorkflowStep.PRODUCT,
            WorkflowStep.UPLOAD,
            WorkflowStep.INGESTION,
            WorkflowStep.VALIDATION,
            WorkflowStep.CLEANING,
            WorkflowStep.NORMALIZATION,
            WorkflowStep.PREPROCESSING,
            WorkflowStep.AI_ANALYSIS,
            WorkflowStep.AGENT_1,
            WorkflowStep.AGENT_2,
            WorkflowStep.AGENT_3,
            WorkflowStep.INTELLIGENCE,
            WorkflowStep.REPORT,
        ]


workflow_state_machine = WorkflowStateMachine()
can_transition = workflow_state_machine.can_transition
get_step_order = workflow_state_machine.get_step_order
