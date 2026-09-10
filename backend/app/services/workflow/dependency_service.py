from __future__ import annotations
from app.core.constants import WorkflowStep
from app.services.workflow.workflow_state import get_step_order


class WorkflowDependencyService:
    """Manages prerequisite dependency requirements across workflow steps."""

    def get_dependencies(self, step: WorkflowStep) -> list[WorkflowStep]:
        order = get_step_order()
        try:
            idx = order.index(step)
            return order[:idx]
        except ValueError:
            return []

    def is_step_ready(self, step: WorkflowStep, completed_steps: set[WorkflowStep]) -> bool:
        deps = self.get_dependencies(step)
        return all(d in completed_steps for d in deps)

    def get_next_step(self, completed_steps: set[WorkflowStep]) -> WorkflowStep | None:
        order = get_step_order()
        for step in order:
            if step not in completed_steps and self.is_step_ready(step, completed_steps):
                return step
        return None

    def get_blocked_steps(self, completed_steps: set[WorkflowStep]) -> list[WorkflowStep]:
        order = get_step_order()
        blocked = []
        for step in order:
            if step not in completed_steps and not self.is_step_ready(step, completed_steps):
                blocked.append(step)
        return blocked


workflow_dependency_service = WorkflowDependencyService()
get_dependencies = workflow_dependency_service.get_dependencies
is_step_ready = workflow_dependency_service.is_step_ready
get_next_step = workflow_dependency_service.get_next_step
get_blocked_steps = workflow_dependency_service.get_blocked_steps
