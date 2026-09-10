"""
Unit tests for Workflow State Machine, Dependencies, and Validator.
"""

from app.services.workflow.workflow_state import WorkflowStateMachine
from app.services.workflow.dependency_service import WorkflowDependencyService
from app.services.workflow.workflow_validator import WorkflowValidator
from app.core.constants import WorkflowStep, WorkflowStepStatus


def test_workflow_state_machine():
    sm = WorkflowStateMachine()

    # NOT_STARTED -> IN_PROGRESS is valid
    assert sm.can_transition(WorkflowStepStatus.NOT_STARTED, WorkflowStepStatus.IN_PROGRESS) is True
    assert sm.can_transition(WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.COMPLETED) is True
    # COMPLETED -> NOT_STARTED is invalid directly
    assert sm.can_transition(WorkflowStepStatus.COMPLETED, WorkflowStepStatus.NOT_STARTED) is False


def test_workflow_dependencies():
    dep_service = WorkflowDependencyService()

    # Ingestion requires UPLOAD
    deps = dep_service.get_dependencies(WorkflowStep.INGESTION)
    assert WorkflowStep.UPLOAD in deps

    # Validation requires INGESTION
    deps = dep_service.get_dependencies(WorkflowStep.VALIDATION)
    assert WorkflowStep.INGESTION in deps

    # Check if Validation is ready when Ingestion is completed
    completed = {WorkflowStep.AUTH, WorkflowStep.WORKSPACE, WorkflowStep.PRODUCT, WorkflowStep.UPLOAD, WorkflowStep.INGESTION}
    assert dep_service.is_step_ready(WorkflowStep.VALIDATION, completed) is True
    assert dep_service.is_step_ready(WorkflowStep.CLEANING, completed) is False  # Cleaning needs Validation

