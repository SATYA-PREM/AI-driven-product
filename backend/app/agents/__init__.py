"""
agents package.
Exports the Data Agent (Milestone 1) and the 3 Milestone 2 AI Agents:
- Agent 1: Feedback Analysis Agent (feedback_analysis)
- Agent 2: Pattern & Trend Agent (pattern_trend)
- Agent 3: Product Intelligence Agent (product_intelligence)
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

# Clean aliases aligned with workflow terminology
feedback_analysis = feedback_analysis_agent
pattern_trend = pattern_trend_agent
product_intelligence = product_intelligence_agent

# Lazy import for AIOrchestrator to prevent circular imports
def __getattr__(name: str):
    if name in ("AIOrchestrator", "ai_orchestrator"):
        from app.workflow.orchestrator import AIOrchestrator, ai_orchestrator
        if name == "AIOrchestrator":
            return AIOrchestrator
        return ai_orchestrator
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

__all__ = [
    "DataAgent",
    "data_agent",
    "FeedbackAnalysisAgent",
    "feedback_analysis_agent",
    "feedback_analysis",
    "PatternTrendAgent",
    "pattern_trend_agent",
    "pattern_trend",
    "ProductIntelligenceAgent",
    "product_intelligence_agent",
    "product_intelligence",
    "AIOrchestrator",
    "ai_orchestrator",
]
