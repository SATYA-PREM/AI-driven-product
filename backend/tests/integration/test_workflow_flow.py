"""
Integration test for workflow tracking progression.
"""

from app.services.workflow.workflow_service import WorkflowService
from app.core.constants import WorkflowStepStatus, WorkflowStep


def test_workflow_progress_calculation():
    steps = [
        {"name": "auth", "status": WorkflowStepStatus.COMPLETED.value},
        {"name": "workspace", "status": WorkflowStepStatus.COMPLETED.value},
        {"name": "product", "status": WorkflowStepStatus.IN_PROGRESS.value},
        {"name": "upload", "status": WorkflowStepStatus.NOT_STARTED.value},
    ]
    progress = WorkflowService.calculate_progress(steps)
    assert progress == 50.0

