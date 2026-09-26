"""
test_prd_system.py
-------------------
Unit tests for Milestone 3 PRD Generation System:
- Single Batch PRD Context Payload Builder
- Multi-collection PRD Tree Persistence & Versioning
- PM Review Approval Gates
- Requirement & User Story Decomposition
- End-to-End Lineage & Provenance Resolution
"""

import pytest
from app.services.prd.prd_context_builder import prd_context_builder
from app.services.prd.prd_service import prd_service
from app.repositories.prd_repository import prd_repository
from app.core.database import (
    product_insights_collection,
    prd_projects_collection,
    prd_documents_collection,
    prd_requirements_collection,
    user_stories_collection,
    development_tasks_collection,
)


def test_prd_context_builder_single_batch_payload():
    """Verify that PRDContextBuilder aggregates approved PM review decisions into ONE batch package."""
    ws_id = "test-ws-prd-001"
    
    # Insert test accepted insight
    product_insights_collection.insert_one({
        "workspace_id": ws_id,
        "insight_id": "INS-TEST-001",
        "title": "Slow Report CSV Export Latency",
        "summary": "Enterprise users report severe delays when exporting large CSV reports.",
        "severity": "high",
        "frequency": 42,
        "dominant_sentiment": "negative",
        "review_status": "ACCEPTED",
        "evidence_record_ids": ["FB001", "FB002"]
    })

    context = prd_context_builder.build_context(
        workspace_id=ws_id,
        source_review_id="REV-TEST-001",
        pm_comments="Prioritize export performance and enterprise reliability."
    )

    assert context["workspace_id"] == ws_id
    assert context["source_review_id"] == "REV-TEST-001"
    assert context["pm_review"]["review_status"] == "APPROVED"
    assert "Prioritize export performance" in context["pm_review"]["comments"]
    assert len(context["approved_issues"]) >= 1
    assert context["approved_issues"][0]["title"] == "Slow Report CSV Export Latency"
    assert context["approved_issues"][0]["evidence_count"] >= 2


def test_prd_batch_generation_and_multi_collection_tree():
    """Verify batch PRD generation and tree structure across all collections."""
    ws_id = "test-ws-prd-002"

    tree = prd_service.generate_prd_from_review(
        workspace_id=ws_id,
        source_review_id="REV-TEST-002",
        pm_comments="Focus on instant filtering and CSV export."
    )

    prd_id = tree["project"]["prd_id"]
    assert prd_id.startswith("PRD-")
    assert tree["project"]["status"] == "draft"
    assert tree["document"]["title"] is not None
    assert len(tree["requirements"]) >= 1
    assert len(tree["features"]) >= 1
    assert len(tree["user_stories"]) >= 1
    assert len(tree["tasks"]) >= 1

    # Verify database persistence
    stored_proj = prd_repository.find_project_by_prd_id(prd_id)
    assert stored_proj is not None
    assert stored_proj["workspace_id"] == ws_id

    stored_doc = prd_repository.get_document(prd_id)
    assert stored_doc is not None
    assert len(stored_doc.get("requirements", [])) >= 1


def test_prd_section_editing_and_versioning():
    """Verify section editing updates version numbers and creates version snapshots."""
    ws_id = "test-ws-prd-003"
    tree = prd_service.generate_prd_from_review(workspace_id=ws_id, source_review_id="REV-003")
    prd_id = tree["project"]["prd_id"]

    updated_tree = prd_service.update_prd_document(
        prd_id=prd_id,
        update_data={
            "problem_statement": "Updated problem statement by PM: Export timeouts block month-end reporting.",
            "business_objective": "Increase report generation speed by 80%."
        }
    )

    assert updated_tree["document"]["problem_statement"].startswith("Updated problem statement")
    assert updated_tree["project"]["current_version"] == "v1.1"
    assert len(updated_tree["versions"]) >= 2


def test_prd_pm_review_gate_approval():
    """Verify PM review approval gate updates status and records decision."""
    ws_id = "test-ws-prd-004"
    tree = prd_service.generate_prd_from_review(workspace_id=ws_id, source_review_id="REV-004")
    prd_id = tree["project"]["prd_id"]

    approved_tree = prd_service.submit_prd_pm_review(
        prd_id=prd_id,
        decision="approved",
        comments=[{"section": "general", "comment": "Approved for sprint planning."}],
        reviewed_by="Priya Sharma (PM)"
    )

    assert approved_tree["project"]["status"] == "approved"
    assert approved_tree["project"]["approved_at"] is not None
    assert len(approved_tree["reviews"]) >= 1
    assert approved_tree["reviews"][0]["decision"] == "approved"


def test_prd_provenance_backward_lineage():
    """Verify end-to-end provenance resolution from Task back to Customer Evidence."""
    ws_id = "test-ws-prd-005"
    tree = prd_service.generate_prd_from_review(workspace_id=ws_id, source_review_id="REV-005")
    prd_id = tree["project"]["prd_id"]
    task_id = tree["tasks"][0]["task_id"]

    trace = prd_service.get_provenance_chain(prd_id=prd_id, item_type="task", item_id=task_id)
    assert trace["item_id"] == task_id
    chain = trace["provenance_chain"]
    assert len(chain) >= 4
    stages = [c["stage"] for c in chain]
    assert "Development Task" in stages
    assert "User Story" in stages
    assert "Requirement" in stages
    assert "PRD Document" in stages
