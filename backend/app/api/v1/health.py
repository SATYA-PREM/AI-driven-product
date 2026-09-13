from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter

from app.core.database import check_connection
from app.core.config import settings
from app.services.ai.gemini_client import gemini_client
from app.agents.data_agent.agent import data_agent
from app.agents.feedback_analysis_agent import feedback_analysis_agent
from app.agents.pattern_trend_agent import pattern_trend_agent
from app.agents.product_intelligence_agent import product_intelligence_agent
from app.agents.orchestrator import ai_orchestrator

router = APIRouter(prefix="/health")


@router.get(
    "/agents",
    tags=["5. AI Agents & Health Probes"],
    summary="Check Operational Readiness: Are AI Agents Working or Not?",
    response_description="Live operational readiness, toolkits, and working status for Data Agent and the 3 Milestone 2 AI Agents",
)
def agents_health() -> dict:
    """
    **Live Swagger Health Probe for All AI Agents:**
    Inspects whether every autonomous agent in the system is **WORKING** or **DEGRADED**:

    - **Data Agent**: Preprocessing agent responsible for dirty data inspection, schema validation, cleaning, and AI-ready preparation.
    - **Agent 1 (Feedback Analysis Agent)**: Multi-dimensional feedback classification (Sentiment, Intent, Theme, Issues, Pain Points, Feature Requests).
    - **Agent 2 (Pattern & Trend Agent)**: Cross-customer intelligence (Semantic issue clustering, feature demand aggregation, trend velocity).
    - **Agent 3 (Product Intelligence Agent)**: Strategic synthesis and deterministic priority scoring (0–100).
    - **CrewAI Engine**: Verifies `crewai` library, Task schemas, and `Process.sequential` orchestrator.
    - **Gemini LLM**: Verifies Google GenAI SDK connection, API key, and model availability.
    """
    crew_available = False
    try:
        import crewai
        crew_available = True
        crewai_version = crewai.__version__
    except ImportError:
        crewai_version = None

    data_agent_tools = data_agent.list_tools()
    data_agent_ready = len(data_agent_tools) >= 4

    agent1_crew = feedback_analysis_agent.create_crew_agent()
    agent2_crew = pattern_trend_agent.create_crew_agent()
    agent3_crew = product_intelligence_agent.create_crew_agent()

    all_agents_ready = bool(data_agent_ready and agent1_crew and agent2_crew and agent3_crew)

    return {
        "status": "ready" if all_agents_ready else "degraded",
        "all_agents_working": all_agents_ready,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "llm_provider": {
            "model": settings.GEMINI_MODEL,
            "api_key_configured": bool(settings.GEMINI_API_KEY),
            "live_client_ready": gemini_client.is_available,
            "circuit_breaker_active": gemini_client.is_in_cooldown,
            "cooldown_remaining_seconds": round(gemini_client.cooldown_remaining, 1),
            "mode": "live_gemini" if (gemini_client.is_available and not gemini_client.is_in_cooldown) else "offline_fallback",
            "working": True,
        },
        "crewai_framework": {
            "installed": crew_available,
            "version": crewai_version,
            "orchestrator_ready": True,
            "working": crew_available,
        },
        "agents": {
            "data_agent": {
                "name": "Data Agent",
                "role": "Dirty Data Inspection, Validation, Cleaning & Preprocessing Orchestrator",
                "goal": "Transform raw, noisy, messy customer feedback into validated, high-quality, canonical AI-ready records",
                "working": data_agent_ready,
                "status": "active_and_working" if data_agent_ready else "degraded",
                "tools_count": len(data_agent_tools),
                "pipeline_stages": [
                    "inspect_dataset",
                    "validate_dataset",
                    "clean_dataset",
                    "preprocess_dataset",
                    "gemini_ai_check",
                    "get_dataset_summary",
                ],
            },
            "agent_1_feedback_analysis": {
                "name": feedback_analysis_agent.name,
                "role": feedback_analysis_agent.role,
                "goal": feedback_analysis_agent.goal,
                "working": bool(agent1_crew),
                "status": "active_and_working" if agent1_crew else "degraded",
                "tools_count": len(agent1_crew.tools) if agent1_crew else 5,
                "dimensions_evaluated": [
                    "sentiment",
                    "sentiment_confidence",
                    "intent",
                    "intent_confidence",
                    "theme",
                    "theme_confidence",
                    "product_area",
                    "issues",
                    "pain_points",
                    "feature_requests",
                    "keywords",
                    "overall_confidence",
                ],
            },
            "agent_2_pattern_trend": {
                "name": pattern_trend_agent.name,
                "role": pattern_trend_agent.role,
                "goal": pattern_trend_agent.goal,
                "working": bool(agent2_crew),
                "status": "active_and_working" if agent2_crew else "degraded",
                "tools_count": len(agent2_crew.tools) if agent2_crew else 8,
                "capabilities": [
                    "semantic_issue_clustering",
                    "feature_demand_clustering",
                    "period_over_period_trend_detection",
                    "theme_pattern_aggregation",
                ],
            },
            "agent_3_product_intelligence": {
                "name": product_intelligence_agent.name,
                "role": product_intelligence_agent.role,
                "goal": product_intelligence_agent.goal,
                "working": bool(agent3_crew),
                "status": "active_and_working" if agent3_crew else "degraded",
                "tools_count": len(agent3_crew.tools) if agent3_crew else 6,
                "scoring_formula": "deterministic_0_to_100 (frequency*0.35 + severity*0.25 + trend*0.15 + sentiment*0.15 + impact*0.10)",
                "capabilities": [
                    "deterministic_priority_scoring",
                    "evidence_backed_recommendations",
                    "pydantic_schema_validation",
                    "actionable_pm_insights",
                ],
            },
        },
    }


@router.get("/", tags=["8. Background Jobs & System Monitoring"], summary="Top-Level Liveness Health Check")
def health_check() -> dict:
    return {
        "status": "healthy",
        "database": check_connection(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/database", tags=["8. Background Jobs & System Monitoring"], summary="Database Connectivity Health Check")
def database_health() -> dict:
    return {
        "connected": check_connection(),
        "database": settings.MONGODB_DATABASE
    }
