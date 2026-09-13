"""
test_workflow_stages.py
-----------------------
Unit tests for master workflow sequencing and stage-gating enforcement:
1. Validates canonical WorkflowState definitions and progression.
2. Verifies stage-jumping rejection (e.g. Analysis on UPLOADED dataset).
3. Verifies pipeline visual progress generation for frontend dashboards.
4. Verifies WorkflowTransitionError integration with FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.workflow.states import WorkflowState
from app.workflow.transitions import (
    can_transition,
    require_dataset_stage,
    get_pipeline_progress,
    MASTER_PIPELINE_SEQUENCE,
)
from app.core.exceptions import WorkflowTransitionError
from app.main import app


def test_master_sequence_definitions():
    """Verify that all milestone states exist in the canonical WorkflowState enum."""
    expected_states = [
        "CREATED",
        "UPLOADED",
        "VALIDATING",
        "VALIDATED",
        "CLEANING",
        "CLEANED",
        "PREPROCESSING",
        "PREPROCESSED",
        "AI_ANALYSIS",
        "AGENT_1_COMPLETED",
        "AGENT_2_COMPLETED",
        "AGENT_3_COMPLETED",
        "AGGREGATING",
        "INTELLIGENCE_READY",
        "REPORT_READY",
        "COMPLETED",
        "FAILED",
    ]
    for s in expected_states:
        assert hasattr(WorkflowState, s)
        assert WorkflowState(s) is not None


def test_allowed_linear_transitions():
    """Verify that linear step-by-step progression is allowed."""
    assert can_transition(WorkflowState.CREATED, WorkflowState.VALIDATING) is True
    assert can_transition(WorkflowState.UPLOADED, WorkflowState.VALIDATING) is True
    assert can_transition(WorkflowState.VALIDATING, WorkflowState.VALIDATED) is True
    assert can_transition(WorkflowState.VALIDATED, WorkflowState.CLEANING) is True
    assert can_transition(WorkflowState.CLEANING, WorkflowState.CLEANED) is True
    assert can_transition(WorkflowState.CLEANED, WorkflowState.PREPROCESSING) is True
    assert can_transition(WorkflowState.PREPROCESSING, WorkflowState.PREPROCESSED) is True
    assert can_transition(WorkflowState.PREPROCESSED, WorkflowState.AI_ANALYSIS) is True
    assert can_transition(WorkflowState.AI_ANALYSIS, WorkflowState.AGENT_1_COMPLETED) is True
    assert can_transition(WorkflowState.AGENT_1_COMPLETED, WorkflowState.AGENT_2_COMPLETED) is True
    assert can_transition(WorkflowState.AGENT_2_COMPLETED, WorkflowState.AGENT_3_COMPLETED) is True
    assert can_transition(WorkflowState.AGENT_3_COMPLETED, WorkflowState.AGGREGATING) is True
    assert can_transition(WorkflowState.AGGREGATING, WorkflowState.INTELLIGENCE_READY) is True
    assert can_transition(WorkflowState.INTELLIGENCE_READY, WorkflowState.REPORT_READY) is True
    assert can_transition(WorkflowState.REPORT_READY, WorkflowState.COMPLETED) is True


def test_stage_jumping_prevention():
    """Verify that skipping required pipeline stages is rejected."""
    # Cannot jump directly from CREATED/UPLOADED to AI_ANALYSIS
    assert can_transition(WorkflowState.CREATED, WorkflowState.AI_ANALYSIS) is False
    assert can_transition(WorkflowState.UPLOADED, WorkflowState.PREPROCESSED) is False
    assert can_transition(WorkflowState.VALIDATING, WorkflowState.CLEANED) is False
    assert can_transition(WorkflowState.CLEANED, WorkflowState.COMPLETED) is False


def test_require_dataset_stage_enforcement():
    """Verify require_dataset_stage raises WorkflowTransitionError upon out-of-order execution."""
    # Test 1: Trying to run Analysis on an UPLOADED dataset fails
    uploaded_dataset = {"dataset_id": "ds-001", "status": "UPLOADED"}
    with pytest.raises(WorkflowTransitionError) as exc_info:
        require_dataset_stage(
            dataset=uploaded_dataset,
            required_states=WorkflowState.PREPROCESSED,
            operation_name="AI Analysis",
        )
    assert exc_info.value.status_code == 400
    assert "UPLOADED" in exc_info.value.message
    assert "PREPROCESSED" in exc_info.value.message

    # Test 2: Trying to run Preprocessing on a VALIDATED dataset fails (needs CLEANED)
    validated_dataset = {"dataset_id": "ds-002", "status": "VALIDATED"}
    with pytest.raises(WorkflowTransitionError) as exc_info:
        require_dataset_stage(
            dataset=validated_dataset,
            required_states=WorkflowState.CLEANED,
            operation_name="Preprocessing",
        )
    assert exc_info.value.status_code == 400

    # Test 3: Succeeded when in valid prerequisite state
    preprocessed_dataset = {"dataset_id": "ds-003", "status": "PREPROCESSED"}
    # Should not raise
    require_dataset_stage(
        dataset=preprocessed_dataset,
        required_states=WorkflowState.PREPROCESSED,
        operation_name="AI Analysis",
    )


def test_pipeline_progress_visualization():
    """Verify visual step-by-step progression generator."""
    # At CLEANED stage: Upload, Validation, Cleaning should be completed; Preprocessing pending
    progress = get_pipeline_progress(WorkflowState.CLEANED)
    stages = {s["name"]: s["status"] for s in progress["stages"]}

    assert stages["Upload"] == "completed"
    assert stages["Validation"] == "completed"
    assert stages["Cleaning"] == "completed"
    assert stages["Preprocessing"] == "current"  # Ready to be preprocessed next
    assert stages["AI Analysis"] == "pending"
    assert stages["Intelligence"] == "pending"
    assert stages["Report"] == "pending"


def test_api_rejection_on_stage_jump(monkeypatch):
    """Verify that the FastAPI endpoint returns HTTP 400 with clear details when skipping stages."""
    client = TestClient(app)

    # Mock dataset_repository to return an UPLOADED dataset
    from app.repositories.dataset_repository import dataset_repository
    monkeypatch.setattr(
        dataset_repository,
        "find_by_id",
        lambda _: {"dataset_id": "ds-test-123", "workspace_id": "ws-123", "status": "UPLOADED"},
    )

    # Bypass auth dependency for the test
    from app.middleware.auth_middleware import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"_id": "user-123", "role": "pm"}

    try:
        response = client.post("/api/v1/datasets/ds-test-123/analysis")
        assert response.status_code == 400
        data = response.json()
        assert "Cannot execute 'AI Analysis" in data.get("detail", {}).get("message", "") or "Cannot execute 'AI Analysis" in str(data)
    finally:
        app.dependency_overrides.clear()


def test_ready_alias_normalizes_to_preprocessed():
    """Verify that READY alias normalizes to PREPROCESSED so pipeline doesn't prematurely mark COMPLETED."""
    assert WorkflowState.normalize("READY") == WorkflowState.PREPROCESSED
    assert WorkflowState.normalize("ready") == WorkflowState.PREPROCESSED


def test_unlimited_records_retrieval(monkeypatch):
    """Verify that repositories retrieve 100% of dataset records when limit=0 or None."""
    from app.repositories.analysis_repository import analysis_repository

    dataset_id = "test-unlimited-ds"
    for i in range(120):
        key = f"{dataset_id}:fb_{i}"
        analysis_repository._memory_store[key] = {
            "dataset_id": dataset_id,
            "feedback_id": f"fb_{i}",
            "analysis": {"sentiment": "positive"},
        }

    # Mock collection.find to raise so it uses the memory store immediately without timeout
    monkeypatch.setattr(
        analysis_repository.collection,
        "find",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("offline")),
    )

    all_recs = analysis_repository.get_by_dataset_id(dataset_id=dataset_id, limit=0)
    assert len(all_recs) == 120

    none_recs = analysis_repository.get_by_dataset_id(dataset_id=dataset_id, limit=None)
    assert len(none_recs) == 120

    capped_recs = analysis_repository.get_by_dataset_id(dataset_id=dataset_id, limit=50)
    assert len(capped_recs) == 50


def test_workflow_step_synchronization_after_stage_execution():
    """Verify that workflow_service.sync_dataset_workflow_step correctly records stage completions."""
    from app.services.workflow.workflow_service import workflow_service
    from app.repositories.workflow_repository import workflow_repository

    import uuid
    uid = uuid.uuid4().hex[:8]
    ws_id = f"ws-sync-{uid}"
    ds_id = f"ds-sync-{uid}"

    # 1. Sync validation completed
    res = workflow_service.sync_dataset_workflow_step(
        workspace_id=ws_id,
        dataset_id=ds_id,
        step_name="validation",
        status="completed",
        metadata={"valid_count": 100},
    )
    assert res is not None
    steps = {s["name"]: s["status"] for s in res.get("steps", [])}
    assert steps.get("validation") == "completed"
    assert res.get("progress_percentage", 0) > 0

    # 2. Sync cleaning completed
    res2 = workflow_service.sync_dataset_workflow_step(
        workspace_id=ws_id,
        dataset_id=ds_id,
        step_name="cleaning",
        status="completed",
        metadata={"cleaned_count": 100},
    )
    steps2 = {s["name"]: s["status"] for s in res2.get("steps", [])}
    assert steps2.get("validation") == "completed"
    assert steps2.get("cleaning") == "completed"
    assert res2.get("progress_percentage", 0) > res.get("progress_percentage", 0)

    # 3. Sync preprocessing completed
    res3 = workflow_service.sync_dataset_workflow_step(
        workspace_id=ws_id,
        dataset_id=ds_id,
        step_name="preprocessing",
        status="completed",
    )
    steps3 = {s["name"]: s["status"] for s in res3.get("steps", [])}
    assert steps3.get("preprocessing") == "completed"

    # Verify document in repository
    wf_doc = workflow_repository.find_by_dataset(ws_id, ds_id)
    assert wf_doc is not None
    assert wf_doc["progress_percentage"] > 0
