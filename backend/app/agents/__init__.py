"""
agents package.
Exports the Data Agent (Milestone 1), the 3 Milestone 2 AI Agents,
and the AI Orchestrator.
"""

from app.agents.data_agent.agent import DataAgent, data_agent
from app.agents.feedback_analysis_agent.agent import (
    FeedbackAnalysisAgent,
    feedback_analysis_agent,
)
from app.agents.pattern_trend_agent.agent import (
    PatternTrendAgent,
    pattern_trend_agent,
)
from app.agents.product_intelligence_agent.agent import (
    ProductIntelligenceAgent,
    product_intelligence_agent,
)
from app.agents.orchestrator import AIOrchestrator, ai_orchestrator

__all__ = [
    "DataAgent",
    "data_agent",
    "FeedbackAnalysisAgent",
    "feedback_analysis_agent",
    "PatternTrendAgent",
    "pattern_trend_agent",
    "ProductIntelligenceAgent",
    "product_intelligence_agent",
    "AIOrchestrator",
    "ai_orchestrator",
]

