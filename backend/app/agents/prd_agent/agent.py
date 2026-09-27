"""
agent.py
--------
PRD Generator Agent Orchestrator (CrewAI 4-Agent Pipeline).
Uses the CrewAI Framework (Agent, Task, Crew, Process, LLM) powered by Google Gemini:
- Stage 1: Product Analyst Agent (Customer friction, root causes, evidence synthesis, itemized problems)
- Stage 2: Requirements Analyst Agent & Product Manager Agent (Functional/NFR requirements & product plan)
- Stage 3: PRD Architect Agent (Full PRD synthesis, conflict resolution & traceability)

Returns the complete structured PRD enriched with the full AI Generation Run audit trail.
"""

from __future__ import annotations
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.agents.prd_agent.product_analyst import product_analyst_agent
from app.agents.prd_agent.requirements_analyst import requirements_analyst_agent
from app.agents.prd_agent.product_manager import product_manager_agent
from app.agents.prd_agent.prd_architect import prd_architect_agent
from app.agents.prd_agent import tools

logger = get_logger(__name__)


class PRDAgent:
    """Orchestrator for the CrewAI 4-Agent PRD Generation Pipeline."""

    def __init__(self):
        self.name = "CrewAI 4-Agent PRD Generation Crew"
        self.agent_1 = product_analyst_agent
        self.agent_2 = requirements_analyst_agent
        self.agent_3 = product_manager_agent
        self.agent_4 = prd_architect_agent
        self._tools = {
            "build_prd_context": tools.build_prd_context,
            "validate_prd_payload": tools.validate_prd_payload,
            "save_prd_document": tools.save_prd_document,
        }

    def execute_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """Execute a tool by name."""
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        return self._tools[tool_name](**kwargs)

    def get_crewai_llm(self):
        """Builds a CrewAI LLM instance targeting Gemini."""
        try:
            from crewai import LLM
            model_name = (settings.GEMINI_MODEL or "").split()[0].strip()
            if not model_name.startswith("gemini/"):
                model_name = f"gemini/{model_name}"
            return LLM(model=model_name, api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize CrewAI LLM: {e}")
            return None

    def build_crew(self, context_payload: Dict[str, Any]):
        """Constructs an official CrewAI Crew instance with the 4 specialized agents and explicit context chaining."""
        try:
            from crewai import Agent, Task, Crew, Process
            llm = self.get_crewai_llm()

            a1 = Agent(
                role=self.agent_1.role,
                goal=self.agent_1.goal,
                backstory="Senior Customer Insights & Product Analyst extracting root causes, evidence summaries, and itemized problem definitions from PM review packages.",
                llm=llm,
                verbose=False,
            )
            a2 = Agent(
                role=self.agent_2.role,
                goal=self.agent_2.goal,
                backstory="Lead Technical Requirements Analyst deriving functional and non-functional requirements with testable acceptance criteria.",
                llm=llm,
                verbose=False,
            )
            a3 = Agent(
                role=self.agent_3.role,
                goal=self.agent_3.goal,
                backstory="Principal Technical Product Manager establishing strategic objectives, scope boundaries, priorities, and success metrics.",
                llm=llm,
                verbose=False,
            )
            a4 = Agent(
                role=self.agent_4.role,
                goal=self.agent_4.goal,
                backstory="Principal PRD Architect synthesizing complete structured PRD hierarchies, detecting scope conflicts, and generating end-to-end traceability.",
                llm=llm,
                verbose=False,
            )

            t1 = Task(
                description=f"Analyze consolidated PM context package and extract comprehensive synthesized and itemized problem definitions: {context_payload.get('summary', '')}",
                expected_output="Structured ProblemDefinition JSON with primary_problem and itemized_problems",
                agent=a1,
            )
            t2 = Task(
                description="Derive functional and non-functional requirements from the PM context and Product Analyst output.",
                expected_output="Structured RequirementsAnalysis JSON with distinct acceptance criteria for every approved item",
                agent=a2,
                context=[t1],
            )
            t3 = Task(
                description="Formulate strategic product plan with in-scope/out-of-scope boundaries, features, and success metrics.",
                expected_output="Structured ProductPlan JSON",
                agent=a3,
                context=[t1, t2],
            )
            t4 = Task(
                description="Synthesize final PRD hierarchy, validate completeness, and build end-to-end traceability.",
                expected_output="Structured PRD Document JSON",
                agent=a4,
                context=[t1, t2, t3],
            )

            return Crew(
                agents=[a1, a2, a3, a4],
                tasks=[t1, t2, t3, t4],
                process=Process.sequential,
                verbose=False,
            )
        except Exception as e:
            logger.warning(f"Could not build CrewAI Crew object: {e}")
            return None

    def generate_prd(self, context_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the complete 4-agent multi-stage reasoning pipeline over ONE consolidated context package:
        1. Stage 1: Product Analyst (Problem definition, customer need, evidence synthesis, itemized problems)
        2. Stage 2: Requirements Analyst (Functional/Non-functional REQs with distinct criteria) & Product Manager (Product plan, scope, metrics)
        3. Stage 3: PRD Architect (Document hierarchy, conflict detection, end-to-end traceability)

        Returns the complete structured PRD document enriched with the full AI Generation Run audit trail.
        """
        start_time = time.time()
        workspace_id = context_payload.get("workspace_id", "unknown-workspace")
        logger.info(f"PRDAgent starting 4-Agent Crew execution for workspace {workspace_id} (CrewAI Framework + Gemini)")

        # Stage 1: Product Analyst
        stage_1_start = time.time()
        product_analysis = self.agent_1.analyze(context_payload)
        stage_1_duration = round(time.time() - stage_1_start, 2)
        logger.info(f"Stage 1 (Product Analyst) completed in {stage_1_duration}s")

        # Stage 2: Requirements Analyst & Product Manager
        stage_2_start = time.time()
        requirements_analysis = self.agent_2.analyze(context_payload, product_analysis)
        product_plan = self.agent_3.plan(context_payload, product_analysis, requirements_analysis)
        stage_2_duration = round(time.time() - stage_2_start, 2)
        logger.info(f"Stage 2 (Requirements Analyst + Product Manager) completed in {stage_2_duration}s")

        # Stage 3: PRD Architect Synthesis & Validation
        stage_3_start = time.time()
        final_prd = self.agent_4.synthesize(
            source_context=context_payload,
            product_analysis=product_analysis,
            requirements_analysis=requirements_analysis,
            product_plan=product_plan,
        )
        stage_3_duration = round(time.time() - stage_3_start, 2)
        logger.info(f"Stage 3 (PRD Architect) completed in {stage_3_duration}s")

        total_duration = round(time.time() - start_time, 2)
        now_utc_str = datetime.now(timezone.utc).isoformat()

        # Audit & Run Record
        generation_run = {
            "run_id": f"RUN-{int(time.time())}",
            "workspace_id": workspace_id,
            "total_duration_seconds": total_duration,
            "framework": "CrewAI",
            "llm": "Gemini",
            "stages": {
                "stage_1_product_analyst": {
                    "duration_seconds": stage_1_duration,
                    "output": product_analysis,
                },
                "stage_2_requirements_analyst": {
                    "duration_seconds": stage_2_duration,
                    "output": requirements_analysis,
                },
                "stage_2_product_manager": {
                    "duration_seconds": stage_2_duration,
                    "output": product_plan,
                },
                "stage_3_prd_architect": {
                    "duration_seconds": stage_3_duration,
                    "status": "COMPLETED",
                },
            },
            "validation": final_prd.get("validation", {"complete": True, "warnings": [], "conflicts": []}),
            "traceability": final_prd.get("traceability", []),
            "generated_at": now_utc_str,
            "status": "SUCCESS",
        }

        # Enrich final PRD with metadata & audit reference
        final_prd["generation_metadata"] = {
            "generated_at": now_utc_str,
            "duration_seconds": total_duration,
            "agent_count": 4,
            "framework": "CrewAI",
            "model": (settings.GEMINI_MODEL or "").split()[0].strip(),
            "status": "SUCCESS",
            "run_id": generation_run["run_id"],
        }
        final_prd["ai_generation_run"] = generation_run

        return final_prd


# Singletons & Aliases
prd_agent = PRDAgent()
PRDGeneratorAgent = PRDAgent
prd_generator_agent = prd_agent
