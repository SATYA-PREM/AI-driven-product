"""
orchestrator.py
---------------
Milestone 2 AI Orchestrator.
Coordinates the sequential execution of the 3 AI Agents:
    Agent 1 (Feedback Analysis) → Agent 2 (Pattern & Trend) → Agent 3 (Product Intelligence)

Handles:
- AI Job lifecycle (creation, tracking, status transitions)
- Background execution
- Isolated failure recovery and retries
- Idempotency and dataset tracking
"""

from __future__ import annotations

import asyncio
import threading
from typing import Any
from datetime import datetime, timezone

from app.core.logging import get_logger
from app.core.constants import AIJobStatus, AgentExecutionStatus
from app.repositories.analysis_repository import ai_job_repository
from app.repositories.data_repository import data_repository
from app.models.ai_analysis import AIJobModel
from app.agents.feedback_analysis_agent import feedback_analysis_agent
from app.agents.pattern_trend_agent import pattern_trend_agent
from app.agents.product_intelligence_agent import product_intelligence_agent

logger = get_logger(__name__)


class AIOrchestrator:
    """Controller and coordinator for the 3-agent Milestone 2 pipeline."""

    def __init__(self):
        self.feedback_agent = feedback_analysis_agent
        self.pattern_agent = pattern_trend_agent
        self.intelligence_agent = product_intelligence_agent

    def create_ai_job(
        self,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
    ) -> dict[str, Any]:
        """Create a new AI job document in MongoDB."""
        job_doc = AIJobModel.create_document(
            workspace_id=workspace_id,
            dataset_id=dataset_id,
            analysis_version=analysis_version,
        )
        ai_job_repository.create_job(job_doc)
        logger.info(f"Created AI Job {job_doc['job_id']} for dataset={dataset_id}")
        return job_doc

    def trigger_pipeline_async(
        self,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
    ) -> str:
        """
        Create job and trigger sequential agent execution in a background thread.
        Returns job_id immediately.
        """
        job_doc = self.create_ai_job(
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            analysis_version=analysis_version,
        )
        job_id = job_doc["job_id"]

        thread = threading.Thread(
            target=self.run_pipeline,
            args=(job_id, dataset_id, workspace_id, analysis_version),
            daemon=True,
        )
        thread.start()
        return job_id

    def run_pipeline(
        self,
        job_id: str,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
    ) -> dict[str, Any]:
        """
        Execute the 3-agent pipeline sequentially:
        Stage 1: Agent 1 (Feedback Analysis)
        Stage 2: Agent 2 (Pattern & Trend)
        Stage 3: Agent 3 (Product Intelligence)
        """
        logger.info(f"AI Orchestrator: Starting pipeline execution for job={job_id}")
        ai_job_repository.update_job_status(job_id, AIJobStatus.RUNNING.value)

        # ── STAGE 1: Agent 1 (Feedback Analysis) ──────────────────────
        try:
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="feedback_analysis",
                status=AgentExecutionStatus.RUNNING.value,
                current_agent="feedback_analysis",
            )

            # Retrieve AI-ready records from Milestone 1 processed_data
            records = data_repository.get_processed_records(dataset_id=dataset_id, limit=500)
            if not records:
                # Fallback to raw_data if preprocessing step wasn't populated in local tests
                records = data_repository.get_raw_records(dataset_id=dataset_id, limit=500)

            logger.info(f"Orchestrator Stage 1: Processing {len(records)} records through Agent 1")
            agent1_results = self.feedback_agent.analyze_batch(
                records=records,
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                analysis_version=analysis_version,
            )

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="feedback_analysis",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent="pattern_trend",
            )
            logger.info(f"Orchestrator Stage 1 completed successfully for job={job_id}")

        except Exception as e:
            logger.error(f"Orchestrator Stage 1 (Agent 1) failed: {e}")
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="feedback_analysis",
                status=AgentExecutionStatus.FAILED.value,
            )
            ai_job_repository.update_job_status(job_id, AIJobStatus.FAILED.value, error=str(e))
            return {"status": "failed", "step": "feedback_analysis", "error": str(e)}

        # ── STAGE 2: Agent 2 (Pattern & Trend) ────────────────────────
        try:
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="pattern_trend",
                status=AgentExecutionStatus.RUNNING.value,
                current_agent="pattern_trend",
            )

            logger.info(f"Orchestrator Stage 2: Discovering patterns & trends via Agent 2")
            agent2_results = self.pattern_agent.analyze_patterns(
                dataset_id=dataset_id,
                workspace_id=workspace_id,
                analysis_version=analysis_version,
            )

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="pattern_trend",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent="product_intelligence",
            )
            logger.info(f"Orchestrator Stage 2 completed successfully for job={job_id}")

        except Exception as e:
            logger.error(f"Orchestrator Stage 2 (Agent 2) failed: {e}")
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="pattern_trend",
                status=AgentExecutionStatus.FAILED.value,
            )
            ai_job_repository.update_job_status(job_id, AIJobStatus.FAILED.value, error=str(e))
            return {"status": "failed", "step": "pattern_trend", "error": str(e)}

        # ── STAGE 3: Agent 3 (Product Intelligence) ───────────────────
        try:
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="product_intelligence",
                status=AgentExecutionStatus.RUNNING.value,
                current_agent="product_intelligence",
            )

            logger.info(f"Orchestrator Stage 3: Formulating Product Intelligence via Agent 3")
            agent3_results = self.intelligence_agent.generate_product_intelligence(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                analysis_version=analysis_version,
            )

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="product_intelligence",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent=None,
            )
            ai_job_repository.update_job_status(job_id, AIJobStatus.COMPLETED.value)
            logger.info(f"AI Orchestrator: Complete pipeline successfully finished for job={job_id}")

            return {
                "job_id": job_id,
                "status": "completed",
                "stage_1_analyzed": agent1_results.get("completed_count", 0),
                "stage_2_clusters": agent2_results.get("issue_clusters_count", 0),
                "stage_3_insights": agent3_results.get("insights_count", 0),
            }

        except Exception as e:
            logger.error(f"Orchestrator Stage 3 (Agent 3) failed: {e}")
            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="product_intelligence",
                status=AgentExecutionStatus.FAILED.value,
            )
            ai_job_repository.update_job_status(job_id, AIJobStatus.FAILED.value, error=str(e))
            return {"status": "failed", "step": "product_intelligence", "error": str(e)}

    def build_crew(
        self,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
        llm: Any = None,
    ) -> Any:
        """
        Build the official CrewAI Crew containing the 3 Milestone 2 agents and their sequential tasks.
        """
        try:
            from crewai import Agent, Crew, Process, Task, LLM
            from app.core.config import settings

            if llm is None and settings.GEMINI_API_KEY:
                llm = LLM(
                    model=f"gemini/{settings.GEMINI_MODEL}",
                    api_key=settings.GEMINI_API_KEY,
                )

            crew_agent_1 = self.feedback_agent.create_crew_agent(llm=llm)
            crew_agent_2 = self.pattern_agent.create_crew_agent(llm=llm)
            crew_agent_3 = self.intelligence_agent.create_crew_agent(llm=llm)

            if not all([crew_agent_1, crew_agent_2, crew_agent_3]):
                return None

            task_1 = Task(
                description=(
                    f"Analyze all unclassified customer feedback records for dataset '{dataset_id}' "
                    f"in workspace '{workspace_id}'. Use tools to fetch records, analyze them across "
                    f"the 10 product dimensions (sentiment, intent, theme, product_area, issues, "
                    f"pain_points, feature_requests, keywords, confidences), validate them, and persist "
                    f"the results with version '{analysis_version}'."
                ),
                expected_output=(
                    "A summary of analyzed customer feedback records with classification counts, "
                    "sentiment distribution, and persistence confirmation."
                ),
                agent=crew_agent_1,
            )

            task_2 = Task(
                description=(
                    f"Identify cross-customer patterns, issue clusters, feature demand clusters, and "
                    f"metric trends for dataset '{dataset_id}' in workspace '{workspace_id}'. Use tools to "
                    f"fetch validated analyses, group recurring problems and requested features, compute "
                    f"frequencies and trend percentages, and save clusters and trends to MongoDB."
                ),
                expected_output=(
                    "Clustered issues, feature requests, and trend metrics with calculated frequencies "
                    "and directional indicators."
                ),
                agent=crew_agent_2,
            )

            task_3 = Task(
                description=(
                    f"Transform structured findings and clusters from Agent 1 and Agent 2 for dataset '{dataset_id}' "
                    f"in workspace '{workspace_id}' into actionable Product Intelligence. Use tools to fetch "
                    f"issue clusters and feature clusters, compute deterministic priority scores (0-100), "
                    f"formulate evidence-backed recommendations, validate insights, and save them."
                ),
                expected_output=(
                    "Validated product intelligence insights ranked by priority score with concrete "
                    "business impact and recommendations."
                ),
                agent=crew_agent_3,
            )

            crew = Crew(
                agents=[crew_agent_1, crew_agent_2, crew_agent_3],
                tasks=[task_1, task_2, task_3],
                process=Process.sequential,
                verbose=True,
            )
            return crew
        except ImportError:
            logger.debug("CrewAI is not installed; build_crew returned None.")
            return None
        except Exception as e:
            logger.warning(f"Failed to build CrewAI Crew: {e}")
            return None

    def run_crew(
        self,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
        inputs: dict[str, Any] | None = None,
        llm: Any = None,
    ) -> Any:
        """Execute the full CrewAI Crew sequentially."""
        crew = self.build_crew(
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            analysis_version=analysis_version,
            llm=llm,
        )
        if crew is None:
            raise RuntimeError("CrewAI Crew could not be constructed.")

        crew_inputs = inputs or {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "analysis_version": analysis_version,
        }
        return crew.kickoff(inputs=crew_inputs)

    def retry_stage(
        self,
        job_id: str,
        stage_name: str,
    ) -> dict[str, Any]:
        """
        Independent failure recovery: Retry only the failed stage
        without re-running previously completed stages.
        """
        job = ai_job_repository.get_by_job_id(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        dataset_id = job["dataset_id"]
        workspace_id = job["workspace_id"]
        analysis_version = job.get("analysis_version", "v1")

        logger.info(f"AI Orchestrator: Retrying stage={stage_name} for job={job_id}")

        if stage_name == "pattern_trend":
            self.pattern_agent.analyze_patterns(dataset_id, workspace_id, analysis_version)
            # Then run Agent 3
            return self.intelligence_agent.generate_product_intelligence(workspace_id, dataset_id, analysis_version)
        elif stage_name == "product_intelligence":
            return self.intelligence_agent.generate_product_intelligence(workspace_id, dataset_id, analysis_version)
        else:
            return self.run_pipeline(job_id, dataset_id, workspace_id, analysis_version)


ai_orchestrator = AIOrchestrator()

