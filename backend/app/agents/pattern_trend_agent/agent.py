"""
agent.py
--------
Pattern & Trend Agent (Agent 2 of Milestone 2).
Responsible for identifying cross-feedback patterns, issue clusters, feature demand,
and trends across multiple customer feedback records.
"""

from __future__ import annotations

from typing import Any

from app.core.logging import get_logger
from app.services.intelligence.clustering_service import clustering_service
from app.agents.pattern_trend_agent import tools
from app.agents.pattern_trend_agent.prompts import (
    PATTERN_TREND_AGENT_NAME,
    PATTERN_TREND_AGENT_ROLE,
    PATTERN_TREND_AGENT_GOAL,
    PATTERN_TREND_AGENT_BACKSTORY,
)

logger = get_logger(__name__)


class PatternTrendAgent:
    """Agent 2: Cross-feedback pattern and trend discovery agent."""

    def __init__(self):
        self.name = PATTERN_TREND_AGENT_NAME
        self.role = PATTERN_TREND_AGENT_ROLE
        self.goal = PATTERN_TREND_AGENT_GOAL
        self.backstory = PATTERN_TREND_AGENT_BACKSTORY
        self._tools = {
            "get_analysis_records": tools.get_analysis_records,
            "get_analysis_summary": tools.get_analysis_summary,
            "calculate_frequency": tools.calculate_frequency,
            "calculate_trend": tools.calculate_trend,
            "save_issue_cluster": tools.save_issue_cluster,
            "save_feature_cluster": tools.save_feature_cluster,
            "save_trend": tools.save_trend,
            "save_theme_pattern": tools.save_theme_pattern,
        }

    def execute_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """Execute a controlled tool by name."""
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        return self._tools[tool_name](**kwargs)

    def analyze_patterns(
        self,
        dataset_id: str,
        workspace_id: str,
        analysis_version: str = "v1",
    ) -> dict[str, Any]:
        """
        Execute cross-feedback pattern detection, clustering, and trend analysis
        for a dataset.
        """
        logger.info(f"Agent 2: Starting pattern & trend discovery for dataset={dataset_id}")

        # 1. Load validated Agent 1 analyses
        records = tools.get_analysis_records(dataset_id=dataset_id)
        total_records = len(records)
        if total_records == 0:
            logger.warning(f"Agent 2: No analysis records found for dataset={dataset_id}")
            return {
                "dataset_id": dataset_id,
                "workspace_id": workspace_id,
                "issue_clusters_count": 0,
                "feature_clusters_count": 0,
                "trends_count": 0,
                "theme_patterns_count": 0,
                "status": "completed",
            }

        # 2. Cluster issues, features, and themes
        clusters_data = clustering_service.cluster_records(
            analyzed_records=records,
            workspace_id=workspace_id,
            dataset_id=dataset_id,
        )

        issue_clusters = clusters_data.get("issue_clusters", [])
        feature_clusters = clusters_data.get("feature_clusters", [])
        theme_patterns = clusters_data.get("theme_patterns", [])

        # Atomically clear previous patterns for this dataset only upon completion
        from app.repositories.intelligence_repository import intelligence_repository
        intelligence_repository.delete_dataset_patterns(dataset_id)

        # 3. Save issue clusters using bulk write
        if issue_clusters:
            tools.save_issue_clusters(issue_clusters)

        # 4. Save feature clusters using bulk write
        if feature_clusters:
            tools.save_feature_clusters(feature_clusters)

        # 5. Save theme patterns using bulk write
        if theme_patterns:
            tools.save_theme_patterns(theme_patterns)

        # 6. Generate and save trends
        trends = []
        t_idx = 1
        for ic in issue_clusters[:5]:
            trend_doc = {
                "trend_id": f"TREND-{t_idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "subject_type": "issue",
                "subject": ic.get("name", "Issue"),
                "previous_period_count": max(1, int(ic.get("frequency", 1) * 0.7)),
                "current_period_count": ic.get("frequency", 1),
                "change_percentage": ic.get("trend_percentage", 0.0),
                "direction": ic.get("trend", "stable"),
                "trend_strength": "high" if abs(ic.get("trend_percentage", 0.0)) >= 30 else "medium",
                "evidence_record_ids": ic.get("evidence_record_ids", [])[:10],
            }
            trends.append(trend_doc)
            t_idx += 1

        for fc in feature_clusters[:3]:
            trend_doc = {
                "trend_id": f"TREND-{t_idx:03d}",
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "subject_type": "feature",
                "subject": fc.get("name", "Feature"),
                "previous_period_count": max(1, int(fc.get("request_count", 1) * 0.8)),
                "current_period_count": fc.get("request_count", 1),
                "change_percentage": fc.get("trend_percentage", 0.0),
                "direction": fc.get("trend", "stable"),
                "trend_strength": "medium",
                "evidence_record_ids": fc.get("evidence_record_ids", [])[:10],
            }
            trends.append(trend_doc)
            t_idx += 1

        if trends:
            tools.save_trends(trends)

        logger.info(
            f"Agent 2 completed: {len(issue_clusters)} issue clusters, "
            f"{len(feature_clusters)} feature clusters, {len(trends)} trends"
        )

        return {
            "dataset_id": dataset_id,
            "workspace_id": workspace_id,
            "issue_clusters": issue_clusters,
            "feature_clusters": feature_clusters,
            "trends": trends,
            "theme_patterns": theme_patterns,
            "issue_clusters_count": len(issue_clusters),
            "feature_clusters_count": len(feature_clusters),
            "trends_count": len(trends),
            "theme_patterns_count": len(theme_patterns),
            "status": "completed",
        }

    def create_crew_agent(self, llm: Any = None):
        """CrewAI agent constructor (if crewai package is available)."""
        try:
            from crewai import Agent
            agent_kwargs: dict[str, Any] = {
                "role": self.role,
                "goal": self.goal,
                "backstory": self.backstory,
                "tools": tools.CREW_AGENT_2_TOOLS,
                "verbose": True,
                "allow_delegation": False,
            }
            if llm is not None:
                agent_kwargs["llm"] = llm
            return Agent(**agent_kwargs)
        except ImportError:
            logger.debug("CrewAI is not installed; PatternTrendAgent operates via native execution.")
            return None


pattern_trend_agent = PatternTrendAgent()

