"""
crewai_prd_generator.py
-----------------------
Batch PRD Generator executing multi-agent reasoning (Product Analyst,
Requirements Analyst, Product Manager Agent, PRD Architect) powered by
Gemini model to produce a complete structured PRD JSON payload.

Delegates execution to the app.agents.prd_agent module.
"""

from __future__ import annotations
from typing import Any, Dict
from app.agents.prd_agent.agent import PRDAgent, prd_agent

class CrewAIPRDGenerator(PRDAgent):
    """
    Executes CrewAI multi-agent workflow for PRD generation over ONE consolidated
    batch context package. Inherits directly from app.agents.prd_agent.PRDAgent.
    """
    pass

crewai_prd_generator = prd_agent
