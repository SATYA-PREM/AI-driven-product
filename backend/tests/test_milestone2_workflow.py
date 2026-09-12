"""
test_milestone2_workflow.py
---------------------------
End-to-end integration test for the complete Milestone 2 workflow:
AI Orchestrator sequencing Agent 1 -> Agent 2 -> Agent 3.
"""

import pytest
from app.agents.orchestrator import AIOrchestrator
from app.repositories.analysis_repository import analysis_repository, ai_job_repository
from app.repositories.intelligence_repository import intelligence_repository


def test_orchestrator_complete_pipeline():
    """Test full sequential execution: Agent 1 -> Agent 2 -> Agent 3."""
    orchestrator = AIOrchestrator()
    dataset_id = "test-dataset-m2"
    workspace_id = "test-workspace-m2"

    # Pre-seed some mock records directly into analyses for testing the pipeline stages
    test_analyses = [
        {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "feedback_id": "FB001",
            "analysis": {
                "theme": "checkout",
                "product_area": "payment_confirmation",
                "sentiment": "negative",
                "intent": "bug_report",
                "issues": ["Payment confirmation error"],
                "feature_requests": [],
                "pain_points": ["Customer cannot verify payment"],
                "keywords": ["payment", "confirmation"],
                "overall_confidence": 0.94,
            },
            "confidence": 0.94,
            "model": "test",
            "analysis_version": "v1",
            "processing_status": "completed",
        },
        {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "feedback_id": "FB013",
            "analysis": {
                "theme": "checkout",
                "product_area": "payment_confirmation",
                "sentiment": "negative",
                "intent": "complaint",
                "issues": ["Payment transaction failed"],
                "feature_requests": [],
                "pain_points": ["Unclear payment state"],
                "keywords": ["payment", "failed"],
                "overall_confidence": 0.91,
            },
            "confidence": 0.91,
            "model": "test",
            "analysis_version": "v1",
            "processing_status": "completed",
        },
        {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "feedback_id": "FB025",
            "analysis": {
                "theme": "reporting",
                "product_area": "bulk_export",
                "sentiment": "neutral",
                "intent": "feature_request",
                "issues": [],
                "feature_requests": ["Add bulk CSV export"],
                "pain_points": ["Manual single export is tedious"],
                "keywords": ["bulk", "export", "csv"],
                "overall_confidence": 0.92,
            },
            "confidence": 0.92,
            "model": "test",
            "analysis_version": "v1",
            "processing_status": "completed",
        },
    ]

    for a in test_analyses:
        analysis_repository.save_analysis(a)

    # 1. Test Agent 2 execution
    agent2_res = orchestrator.pattern_agent.analyze_patterns(
        dataset_id=dataset_id, workspace_id=workspace_id
    )
    assert agent2_res["status"] == "completed"
    assert agent2_res["issue_clusters_count"] >= 1
    assert agent2_res["feature_clusters_count"] >= 1

    # 2. Test Agent 3 execution
    agent3_res = orchestrator.intelligence_agent.generate_product_intelligence(
        workspace_id=workspace_id, dataset_id=dataset_id
    )
    assert agent3_res["status"] == "completed"
    assert agent3_res["insights_count"] >= 1

    # Verify insights in repository
    insights = intelligence_repository.get_product_insights(workspace_id, dataset_id)
    assert len(insights) >= 1
    top_insight = insights[0]
    assert "priority" in top_insight
    assert len(top_insight["evidence_record_ids"]) >= 1
    assert top_insight["priority"]["score"] >= 0.0

