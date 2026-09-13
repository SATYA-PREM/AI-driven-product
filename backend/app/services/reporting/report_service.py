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


from app.services.intelligence.sentiment_service import sentiment_service
from app.repositories.report_repository import report_repository


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

        top_issues = intelligence.get("top_issues", [])
        feature_demands = intelligence.get("top_features", [])
        trends = intelligence.get("trends", [])
        insights = intelligence.get("insights", [])

        sentiment_res = sentiment_service.get_sentiment_breakdown(
            dataset_id=dataset_id,
            workspace_id=workspace_id,
        )
        sentiment = sentiment_res.get("distribution", {})

        summary = intelligence.get("summary", {})
        total_signals = summary.get("total_feedback_analyzed", 0)
        if total_signals == 0:
            total_signals = sentiment_res.get("total_count", 0)
        critical_issues_count = summary.get("high_priority_issues", 0)

        executive_takeaways = []
        if insights:
            top_insight = insights[0]
            title = top_insight.get("title", "Critical Priority Focus")
            score = top_insight.get("priority_score", 0.0)
            executive_takeaways.append(
                f"Strategic priority focus: '{title}' with score {score:.1f}/100."
            )
        elif top_issues:
            top_issue = top_issues[0]
            name = top_issue.get("name") or top_issue.get("title") or "Critical Issue"
            freq = top_issue.get("frequency", 0)
            executive_takeaways.append(
                f"Critical priority focus: '{name}' ({freq} customer reports)."
            )

        if feature_demands:
            top_feature = feature_demands[0]
            name = top_feature.get("name") or top_feature.get("title") or "Top Feature"
            req_count = top_feature.get("request_count") or top_feature.get("frequency", 0)
            executive_takeaways.append(
                f"Leading customer demand: '{name}' ({req_count} requests)."
            )

        if trends:
            top_trend = trends[0]
            subj = top_trend.get("subject", "Theme")
            direction = top_trend.get("direction", "stable")
            change = top_trend.get("change_percentage", 0.0)
            executive_takeaways.append(
                f"Trend trajectory: '{subj}' is {direction} ({change:+.1f}% change)."
            )

        pos_count = sentiment.get("positive", 0)
        neg_count = sentiment.get("negative", 0)
        sentiment_health = "positive" if pos_count >= neg_count and total_signals > 0 else "attention_required"

        report = {
            "report_id": report_id,
            "report_type": report_type,
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "title": f"Product Intelligence Executive Report - {datetime.now(timezone.utc).strftime('%B %Y')}",
            "generated_at": now,
            "created_at": now,
            "updated_at": now,
            "status": "COMPLETED",
            "summary_kpis": {
                "total_signals_analyzed": total_signals,
                "total_issue_clusters": len(top_issues),
                "total_feature_clusters": len(feature_demands),
                "critical_issues_count": critical_issues_count,
                "overall_sentiment_health": sentiment_health,
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

        # Persist report
        report_repository.save_report(report)

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

    def get_latest_report(self, workspace_id: str, dataset_id: str | None = None) -> dict[str, Any]:
        """Retrieve existing latest report or generate on demand."""
        existing = report_repository.get_latest_report(workspace_id=workspace_id, dataset_id=dataset_id)
        if existing:
            existing.pop("_id", None)
            return existing
        return self.generate_product_report(workspace_id=workspace_id, dataset_id=dataset_id)


report_service = ReportService()

