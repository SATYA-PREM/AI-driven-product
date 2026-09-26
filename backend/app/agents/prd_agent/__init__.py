"""
prd_agent package.
Exports the complete CrewAI 4-Agent PRD Generation Architecture:
- Stage 1: ProductAnalystAgent (product_analyst_agent)
- Stage 2: RequirementsAnalystAgent (requirements_analyst_agent), ProductManagerAgent (product_manager_agent)
- Stage 3: PRDArchitectAgent (prd_architect_agent)
- Orchestrator: PRDAgent (prd_agent / prd_generator_agent)
"""

from app.agents.prd_agent.agent import (
    PRDAgent,
    PRDGeneratorAgent,
    prd_agent,
    prd_generator_agent,
)
from app.agents.prd_agent.product_analyst import (
    ProductAnalystAgent,
    product_analyst_agent,
)
from app.agents.prd_agent.requirements_analyst import (
    RequirementsAnalystAgent,
    requirements_analyst_agent,
)
from app.agents.prd_agent.product_manager import (
    ProductManagerAgent,
    product_manager_agent,
)
from app.agents.prd_agent.prd_architect import (
    PRDArchitectAgent,
    prd_architect_agent,
)

__all__ = [
    "PRDAgent",
    "PRDGeneratorAgent",
    "prd_agent",
    "prd_generator_agent",
    "ProductAnalystAgent",
    "product_analyst_agent",
    "RequirementsAnalystAgent",
    "requirements_analyst_agent",
    "ProductManagerAgent",
    "product_manager_agent",
    "PRDArchitectAgent",
    "prd_architect_agent",
]
