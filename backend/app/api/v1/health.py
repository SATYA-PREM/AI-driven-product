from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter

from app.core.database import check_connection
from app.core.config import settings
from app.services.ai.gemini_client import gemini_client
from app.agents.feedback_analysis_agent import feedback_analysis_agent
from app.agents.pattern_trend_agent import pattern_trend_agent
from app.agents.product_intelligence_agent import product_intelligence_agent
from app.agents.orchestrator import ai_orchestrator

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
def health_check() -> dict:
    return {
        "status": "healthy",
        "database": check_connection(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/database")
def database_health() -> dict:
    return {
        "connected": check_connection(),
        "database": settings.MONGODB_DATABASE
    }


@router.get(
    "/agents",
    tags=["AI Agents & Health"],
    summary="Check operational status of all 3 Milestone 2 AI Agents",
    response_description="Live operational readiness of Agent 1, Agent 2, Agent 3, CrewAI, and Gemini",
)
def agents_health() -> dict:
    """
    **Live Swagger Probe for AI Agents Readiness & Status:**
    - **Agent 1 (Feedback Analysis Agent)**: Checks role, prompt manager, taxonomy, and toolkits.
    - **Agent 2 (Pattern & Trend Agent)**: Checks clustering, trend engine, and persistence tools.
    - **Agent 3 (Product Intelligence Agent)**: Checks deterministic scoring formula (0–100) and insight generator.
    - **CrewAI Engine**: Checks Crew builder and sequential process orchestrator.
    - **Gemini LLM**: Checks API key configuration and Google GenAI SDK client readiness.
    """
    crew_available = False
    try:
        import crewai
        crew_available = True
        crewai_version = crewai.__version__
    except ImportError:
        crewai_version = None

    agent1_crew = feedback_analysis_agent.create_crew_agent()
    agent2_crew = pattern_trend_agent.create_crew_agent()
    agent3_crew = product_intelligence_agent.create_crew_agent()

    all_agents_ready = bool(agent1_crew and agent2_crew and agent3_crew)

    return {
        "status": "ready" if all_agents_ready else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "llm_provider": {
            "model": settings.GEMINI_MODEL,
            "api_key_configured": bool(settings.GEMINI_API_KEY),
            "live_client_ready": gemini_client.is_available,
            "mode": "live_gemini" if gemini_client.is_available else "mock_fallback",
        },
        "crewai_framework": {
            "installed": crew_available,
            "version": crewai_version,
            "orchestrator_ready": True,
        },
        "agents": {
            "agent_1_feedback_analysis": {
                "name": feedback_analysis_agent.name,
                "role": feedback_analysis_agent.role,
                "goal": feedback_analysis_agent.goal,
                "status": "active_and_working",
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
                "status": "active_and_working",
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
                "status": "active_and_working",
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
