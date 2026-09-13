"""
report_service.py
-----------------
Generates comprehensive PM product intelligence reports from synthesized
findings across Agent 1, Agent 2, and Agent 3.

Final milestone in the Master Business Sequence:
    ... → AI Execution → Aggregation → Intelligence → REPORT
"""

from __future__ import annotations
from typing import Any
from datetime import datetime, timezone

from app.core.logging import get_logger
from app.services.intelligence.intelligence_service import intelligence_service
from app.workflow.states import WorkflowState
from app.workflow.transitions import require_dataset_stage
from app.repositories.dataset_repository import dataset_repository

logger = get_logger(__name__)


class ReportService:
    """Service responsible for generating and compiling executive PM product intelligence reports."""

    def generate_product_report(
        self,
        workspace_id: str,
        dataset_id: str | None = None,
        report_type: str = "executive_summary",
    ) -> dict[str, Any]:
        """
        Synthesize intelligence data into a structured PM report document.
        """
        # If dataset_id is provided, verify it has completed AI analysis
        if dataset_id:
            dataset = dataset_repository.find_by_id(dataset_id)
            if dataset:
                require_dataset_stage(
                    dataset=dataset,
                    required_states=[
                        WorkflowState.AGENT_3_COMPLETED,
                        WorkflowState.AGGREGATING,
                        WorkflowState.INTELLIGENCE_READY,
                        WorkflowState.REPORT_READY,
                        WorkflowState.COMPLETED,
                    ],
                    operation_name="Report Generation",
                )

        intelligence = intelligence_service.get_workspace_intelligence_summary(
            workspace_id=workspace_id,
            dataset_id=dataset_id,
        )

        now = datetime.now(timezone.utc).isoformat()
        report_id = f"REP-{workspace_id[:8]}-{int(datetime.now(timezone.utc).timestamp())}"

        top_issues = intelligence.get("top_priority_issues", [])
        feature_demands = intelligence.get("feature_demand_rankings", [])
        trends = intelligence.get("emerging_trends", [])
        sentiment = intelligence.get("sentiment_distribution", {})

        executive_takeaways = []
        if top_issues:
            top_issue = top_issues[0]
            executive_takeaways.append(
                f"Critical priority focus: '{top_issue.get('title')}' with score {top_issue.get('priority_score')}/100."
            )
        if feature_demands:
            top_feature = feature_demands[0]
            executive_takeaways.append(
                f"Leading customer demand: '{top_feature.get('feature_name')}' ({top_feature.get('request_count')} requests)."
            )

        report = {
            "report_id": report_id,
            "report_type": report_type,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "title": f"Product Intelligence Executive Report - {datetime.now(timezone.utc).strftime('%B %Y')}",
            "generated_at": now,
            "status": "COMPLETED",
            "summary_kpis": {
                "total_signals_analyzed": intelligence.get("total_feedback_analyzed", 0),
                "total_issue_clusters": len(top_issues),
                "total_feature_clusters": len(feature_demands),
                "critical_issues_count": intelligence.get("critical_issues_count", 0),
                "overall_sentiment_health": "positive" if sentiment.get("positive", 0) > sentiment.get("negative", 0) else "attention_required",
            },
            "executive_takeaways": executive_takeaways,
            "prioritized_issues": top_issues[:5],
            "feature_demand_ranking": feature_demands[:5],
            "emerging_trends": trends[:5],
            "sentiment_overview": sentiment,
            "recommended_next_steps": [
                "Review critical priority issue root causes with engineering leads.",
                "Prioritize top requested features into next quarter product roadmap.",
                "Track period-over-period trend velocity to verify resolution of emerging issues.",
            ],
        }

        # Advance dataset status to REPORT_READY / COMPLETED
        if dataset_id:
            try:
                dataset_repository.update_status(dataset_id, WorkflowState.REPORT_READY.value)
                dataset_repository.update_status(dataset_id, WorkflowState.COMPLETED.value)
            except Exception as e:
                logger.debug(f"Could not update dataset status to COMPLETED: {e}")

            from app.services.workflow.workflow_service import workflow_service
            workflow_service.sync_dataset_workflow_step(
                workspace_id=workspace_id,
                dataset_id=dataset_id,
                step_name="report",
                status="completed",
                metadata={"report_id": report_id},
            )

        logger.info(f"Generated report {report_id} for workspace={workspace_id}, dataset={dataset_id}")
        return report


report_service = ReportService()

