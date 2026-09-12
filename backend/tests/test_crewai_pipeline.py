"""
test_crewai_pipeline.py
-----------------------
Tests verifying full native CrewAI integration:
- Agent 1, Agent 2, Agent 3 create official CrewAI Agent instances with custom tools.
- AIOrchestrator builds the official CrewAI Crew with 3 sequential Tasks.
- Tools execute correctly within the CrewAI tools framework.
"""

import pytest
from app.agents.feedback_analysis_agent import feedback_analysis_agent
from app.agents.pattern_trend_agent import pattern_trend_agent
from app.agents.product_intelligence_agent import product_intelligence_agent
from app.agents.orchestrator import ai_orchestrator
from app.agents.feedback_analysis_agent.tools import CREW_AGENT_1_TOOLS
from app.agents.pattern_trend_agent.tools import CREW_AGENT_2_TOOLS
from app.agents.product_intelligence_agent.tools import CREW_AGENT_3_TOOLS


def test_crewai_agents_creation():
    """Verify that all 3 agents can instantiate CrewAI Agent objects with attached tools."""
    from crewai import Agent

    agent_1 = feedback_analysis_agent.create_crew_agent()
    assert agent_1 is not None
    assert isinstance(agent_1, Agent)
    assert agent_1.role == feedback_analysis_agent.role
    assert len(agent_1.tools) == len(CREW_AGENT_1_TOOLS)

    agent_2 = pattern_trend_agent.create_crew_agent()
    assert agent_2 is not None
    assert isinstance(agent_2, Agent)
    assert agent_2.role == pattern_trend_agent.role
    assert len(agent_2.tools) == len(CREW_AGENT_2_TOOLS)

    agent_3 = product_intelligence_agent.create_crew_agent()
    assert agent_3 is not None
    assert isinstance(agent_3, Agent)
    assert agent_3.role == product_intelligence_agent.role
    assert len(agent_3.tools) == len(CREW_AGENT_3_TOOLS)


def test_crewai_crew_assembly():
    """Verify that AIOrchestrator builds a complete Crew with 3 agents and 3 sequential tasks."""
    from crewai import Crew, Process

    crew = ai_orchestrator.build_crew(
        dataset_id="test_dataset_crew",
        workspace_id="test_workspace_crew",
        analysis_version="v1",
    )

    assert crew is not None
    assert isinstance(crew, Crew)
    assert len(crew.agents) == 3
    assert len(crew.tasks) == 3
    assert crew.process == Process.sequential

    # Check task agents
    assert crew.tasks[0].agent.role == feedback_analysis_agent.role
    assert crew.tasks[1].agent.role == pattern_trend_agent.role
    assert crew.tasks[2].agent.role == product_intelligence_agent.role


def test_crewai_tools_direct_invocation():
    """Verify CrewAI decorated tools can be invoked directly with inputs."""
    # Test Agent 1 tool
    from app.agents.feedback_analysis_agent.tools import get_product_taxonomy, validate_feedback_analysis_tool
    tax = get_product_taxonomy._run() if hasattr(get_product_taxonomy, "_run") else get_product_taxonomy()
    assert "themes" in tax
    assert "checkout" in tax["themes"]

    val_res = validate_feedback_analysis_tool._run(
        analysis_data={
            "feedback_id": "FB-TEST-1",
            "theme": "checkout",
            "theme_confidence": 0.90,
            "product_area": "payment",
            "sentiment": "negative",
            "sentiment_confidence": 0.92,
            "intent": "bug_report",
            "intent_confidence": 0.88,
            "overall_confidence": 0.95,
        }
    ) if hasattr(validate_feedback_analysis_tool, "_run") else validate_feedback_analysis_tool(
        analysis_data={
            "feedback_id": "FB-TEST-1",
            "theme": "checkout",
            "theme_confidence": 0.90,
            "product_area": "payment",
            "sentiment": "negative",
            "sentiment_confidence": 0.92,
            "intent": "bug_report",
            "intent_confidence": 0.88,
            "overall_confidence": 0.95,
        }
    )
    assert val_res["is_valid"] is True

    # Test Agent 3 scoring tool
    from app.agents.product_intelligence_agent.tools import calculate_priority_score_tool
    score_res = calculate_priority_score_tool._run(
        frequency=15,
        total_records=50,
        severity="high",
        trend_direction="increasing",
        trend_percentage=40.0,
        negative_ratio=0.8,
        customer_impact="high",
    ) if hasattr(calculate_priority_score_tool, "_run") else calculate_priority_score_tool(
        frequency=15,
        total_records=50,
        severity="high",
        trend_direction="increasing",
        trend_percentage=40.0,
        negative_ratio=0.8,
        customer_impact="high",
    )
    assert score_res["priority_score"] >= 70.0
    assert score_res["priority_level"] in ["critical", "high", "medium", "low"]


def test_swagger_agents_health_probe():
    """Verify the /api/v1/health/agents probe endpoint returns working status for all 3 agents."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.get("/api/v1/health/agents")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ready"
    assert data["crewai_framework"]["installed"] is True
    assert "agent_1_feedback_analysis" in data["agents"]
    assert "agent_2_pattern_trend" in data["agents"]
    assert "agent_3_product_intelligence" in data["agents"]
    assert data["agents"]["agent_1_feedback_analysis"]["status"] == "active_and_working"
    assert data["agents"]["agent_2_pattern_trend"]["status"] == "active_and_working"
    assert data["agents"]["agent_3_product_intelligence"]["status"] == "active_and_working"
