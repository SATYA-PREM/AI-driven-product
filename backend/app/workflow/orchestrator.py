"""
orchestrator.py
---------------
Master Workflow & AI Pipeline Orchestrator.
Coordinates the sequential execution of the 3 AI Agents:
    Agent 1 (Feedback Analysis) → Agent 2 (Pattern & Trend) → Agent 3 (Product Intelligence)
followed by final aggregation and state transition to INTELLIGENCE_READY / COMPLETED.

The orchestrator is the controller of the entire workflow rather than an individual agent.
"""

from __future__ import annotations

import asyncio
import threading
from typing import Any
from datetime import datetime, timezone

from app.core.logging import get_logger
from app.core.constants import AIJobStatus, AgentExecutionStatus
from app.workflow.states import WorkflowState
from app.repositories.analysis_repository import ai_job_repository, analysis_repository
from app.repositories.data_repository import data_repository
from app.repositories.dataset_repository import dataset_repository
from app.models.ai_analysis import AIJobModel
from app.agents.feedback_analysis_agent import feedback_analysis_agent
from app.agents.pattern_trend_agent import pattern_trend_agent
from app.agents.product_intelligence_agent import product_intelligence_agent

logger = get_logger(__name__)


class AIOrchestrator:
    """Master controller and coordinator for the sequential workflow & AI pipeline."""

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
        Stage 1: Agent 1 (Feedback Analysis) -> AGENT_1_COMPLETED
        Stage 2: Agent 2 (Pattern & Trend)   -> AGENT_2_COMPLETED
        Stage 3: Agent 3 (Product Intelligence) -> AGENT_3_COMPLETED -> INTELLIGENCE_READY -> COMPLETED
        """
        logger.info(f"AI Orchestrator: Starting pipeline execution for job={job_id}")
        ai_job_repository.update_job_status(job_id, AIJobStatus.RUNNING.value)
        try:
            dataset_repository.update_status(dataset_id, WorkflowState.AI_ANALYSIS.value)
        except Exception as e:
            logger.debug(f"Could not update dataset status to AI_ANALYSIS: {e}")

        from app.services.workflow.workflow_service import workflow_service
        workflow_service.sync_dataset_workflow_step(
            workspace_id=workspace_id,
            dataset_id=dataset_id,
            step_name="ai_analysis",
            status="in_progress",
            metadata={"job_id": job_id},
        )

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
            # Retrieve ALL AI-ready records from Milestone 1 processed_data (limit=0 means uncapped)
            records = data_repository.get_processed_records(dataset_id=dataset_id, limit=0)
            if not records:
                # Fallback to raw_data if preprocessing step wasn't populated in local tests
                records = data_repository.get_raw_records(dataset_id=dataset_id, limit=500)
                records = data_repository.get_raw_records(dataset_id=dataset_id, limit=0)

            logger.info(f"Orchestrator Stage 1: Processing {len(records)} records through Agent 1 (job={job_id})")
            agent1_results = self.feedback_agent.analyze_batch(
                records=records,
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                analysis_version=analysis_version,
                job_id=job_id,
            )

            stage1_summary = {
                "total_records": agent1_results.get("total_records", len(records)),
                "completed_count": agent1_results.get("completed_count", 0),
                "failed_count": agent1_results.get("failed_count", 0),
                "low_confidence_count": agent1_results.get("low_confidence_count", 0),
                "sentiment_distribution": analysis_repository.get_sentiment_distribution(dataset_id=dataset_id),
            }
            ai_job_repository.update_stage_output(job_id=job_id, stage_name="stage_1", output_data=stage1_summary)

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="feedback_analysis",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent="pattern_trend",
            )
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.AGENT_1_COMPLETED.value)
            except Exception:
                pass

            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_1",
                status="completed",
                metadata={"analyzed_count": agent1_results.get("completed_count", 0)},
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
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.FAILED.value)
            except Exception:
                pass
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_1",
                status="failed",
                metadata={"error": str(e)},
            )
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="ai_analysis",
                status="failed",
                metadata={"error": str(e)},
            )
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

            ai_job_repository.update_stage_output(job_id=job_id, stage_name="stage_2", output_data=agent2_results)

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="pattern_trend",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent="product_intelligence",
            )
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.AGENT_2_COMPLETED.value)
            except Exception:
                pass

            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_2",
                status="completed",
                metadata={
                    "issue_clusters": agent2_results.get("issue_clusters_count", 0),
                    "feature_clusters": agent2_results.get("feature_clusters_count", 0),
                },
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
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.FAILED.value)
            except Exception:
                pass
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_2",
                status="failed",
                metadata={"error": str(e)},
            )
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="ai_analysis",
                status="failed",
                metadata={"error": str(e)},
            )
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

            ai_job_repository.update_stage_output(job_id=job_id, stage_name="stage_3", output_data=agent3_results)

            final_summary = {
                "stage_1_analyzed": agent1_results.get("completed_count", 0),
                "stage_2_clusters": agent2_results.get("issue_clusters_count", 0),
                "stage_3_insights": agent3_results.get("insights_count", 0),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }

            ai_job_repository.update_agent_status(
                job_id=job_id,
                agent_name="product_intelligence",
                status=AgentExecutionStatus.COMPLETED.value,
                current_agent=None,
            )
            ai_job_repository.update_job_status(job_id, AIJobStatus.COMPLETED.value, summary=final_summary)

            try:
                dataset_repository.update_status(dataset_id, WorkflowState.INTELLIGENCE_READY.value)
                dataset_repository.update_status(dataset_id, WorkflowState.COMPLETED.value)
            except Exception:
                pass

            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_3",
                status="completed",
                metadata={"insights_count": agent3_results.get("insights_count", 0)},
            )
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="intelligence",
                status="completed",
                metadata={"insights_count": agent3_results.get("insights_count", 0)},
            )
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="ai_analysis",
                status="completed",
                metadata={"job_id": job_id, "status": "completed"},
            )

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
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.FAILED.value)
            except Exception:
                pass
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="agent_3",
                status="failed",
                metadata={"error": str(e)},
            )
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="ai_analysis",
                status="failed",
                metadata={"error": str(e)},
            )
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
                    f"in workspace '{workspace_id}'.\n"
                    f"Input: Raw customer feedback records and allowed product taxonomy.\n"
                    f"Execution Rules:\n"
                    f"- Enforce strict 'Do Not Infer' policy: extract only what the customer explicitly states.\n"
                    f"- Distinct categories: separate customer pain points (friction) from issues (concrete defects) "
                    f"and feature requests (explicit suggestions only; empty [] if absent).\n"
                    f"- Do not classify bugs solely from negative sentiment, and do not invent product areas or root causes.\n"
                    f"- Evaluate across all 10 product dimensions, validate against schema, and persist each analysis to MongoDB."
                ),
                expected_output=(
                    "A summary of analyzed customer feedback records with classification counts, "
                    "sentiment distribution, and persistence confirmation."
                    "Validated 10-dimension structured feedback analysis records stored in MongoDB "
                    "with sentiment, intent, theme, product_area, pain_points, issues, feature_requests, "
                    "keywords, and confidence scores, free of unstated inferences."
                ),
                agent=crew_agent_1,
            )

            task_2 = Task(
                description=(
                    f"Identify cross-customer patterns, issue clusters, feature demand clusters, and "
                    f"metric trends for dataset '{dataset_id}' in workspace '{workspace_id}'. Use tools to "
                    f"fetch validated analyses, group recurring problems and requested features, compute "
                    f"frequencies and trend percentages, and save clusters and trends to MongoDB."
                    f"Identify cross-customer patterns, recurring issues, feature demand backlogs, and "
                    f"trends for dataset '{dataset_id}' in workspace '{workspace_id}'.\n"
                    f"Input: Validated Agent 1 feedback analyses.\n"
                    f"Execution Rules:\n"
                    f"- Semantic similarity alone is INSUFFICIENT to establish a recurring problem.\n"
                    f"- Merge issues only when their underlying customer friction is materially identical (not merely by shared theme).\n"
                    f"- Preserve all supporting customer feedback IDs for every cluster without exception.\n"
                    f"- Rely strictly on backend tools for frequency counts and trend deltas; do not fabricate metrics.\n"
                    f"- Do NOT make product-priority or roadmap decisions; focus purely on pattern discovery."
                ),
                expected_output=(
                    "Clustered issues, feature requests, and trend metrics with calculated frequencies "
                    "and directional indicators."
                    "Normalized issue clusters, feature demand backlogs, theme patterns, and period velocity trends "
                    "anchored to auditable customer feedback IDs and stored in MongoDB."
                ),
                agent=crew_agent_2,
            )

            task_3 = Task(
                description=(
                    f"Transform structured findings and clusters from Agent 1 and Agent 2 for dataset '{dataset_id}' "
                    f"in workspace '{workspace_id}' into actionable Product Intelligence. Use tools to fetch "
                    f"issue clusters and feature clusters, compute deterministic priority scores (0-100), "
                    f"formulate evidence-backed recommendations, validate insights, and save them."
                    f"Transform structured findings and clusters from Agent 2 for dataset '{dataset_id}' "
                    f"in workspace '{workspace_id}' into decision-grade Product Intelligence.\n"
                    f"Input: Issue clusters, feature clusters, trend velocity objects, and deterministic scores.\n"
                    f"Execution Rules:\n"
                    f"- Formulate complete insights containing all 10 PM decision fields.\n"
                    f"- Mandatory evidence: every insight must cite at least one verified supporting feedback ID.\n"
                    f"- Use deterministic backend priority scores (0–100) without overriding or modifying them.\n"
                    f"- Designate root causes strictly as 'hypothesis' with explicit confidence levels.\n"
                    f"- Advisory guardrails: Provide PM-level strategic recommendations only; do NOT generate PRDs, "
                    f"engineering tasks, or assign developers."
                ),
                expected_output=(
                    "Validated product intelligence insights ranked by priority score with concrete "
                    "business impact and recommendations."
                    "Validated Product Intelligence insights stored in MongoDB with the 10 PM decision fields: "
                    "business_impact, feature_opportunity, product_recommendation, root_cause hypothesis, "
                    "affected_feature, auditable evidence, confidence, recommended_next_steps, priority, and trend."
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
            return self.intelligence_agent.generate_product_intelligence(workspace_id, dataset_id, analysis_version)
        elif stage_name == "product_intelligence":
            return self.intelligence_agent.generate_product_intelligence(workspace_id, dataset_id, analysis_version)
        else:
            return self.run_pipeline(job_id, dataset_id, workspace_id, analysis_version)


ai_orchestrator = AIOrchestrator()

