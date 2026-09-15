"""
agent.py
--------
Product Intelligence Agent (Agent 3 of Milestone 2).
Responsible for turning patterns, clusters, and trends into prioritized,
evidence-backed product intelligence for the PM dashboard.
"""

from __future__ import annotations

from typing import Any

from app.core.logging import get_logger
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompt_manager import prompt_manager
from app.services.intelligence.insight_service import insight_service
from app.agents.product_intelligence_agent import tools
from app.agents.product_intelligence_agent.prompts import (
    PRODUCT_INTELLIGENCE_AGENT_NAME,
    PRODUCT_INTELLIGENCE_AGENT_ROLE,
    PRODUCT_INTELLIGENCE_AGENT_GOAL,
    PRODUCT_INTELLIGENCE_AGENT_BACKSTORY,
)

logger = get_logger(__name__)


class ProductIntelligenceAgent:
    """Agent 3: Product Intelligence and Strategy Agent."""

    def __init__(self):
        self.name = PRODUCT_INTELLIGENCE_AGENT_NAME
        self.role = PRODUCT_INTELLIGENCE_AGENT_ROLE
        self.goal = PRODUCT_INTELLIGENCE_AGENT_GOAL
        self.backstory = PRODUCT_INTELLIGENCE_AGENT_BACKSTORY
        self._tools = {
            "get_issue_clusters": tools.get_issue_clusters,
            "get_feature_clusters": tools.get_feature_clusters,
            "get_trends": tools.get_trends,
            "calculate_priority_score": tools.calculate_priority_score,
            "validate_product_insight": tools.validate_product_insight,
            "save_product_insight": tools.save_product_insight,
        }

    def execute_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """Execute a controlled tool by name."""
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        return self._tools[tool_name](**kwargs)

    def generate_product_intelligence(
        self,
        workspace_id: str,
        dataset_id: str,
        analysis_version: str = "v1",
    ) -> dict[str, Any]:
        """
        Execute product intelligence formulation for a dataset.
        Combines deterministic scoring with semantic recommendations.
        """
        logger.info(f"Agent 3: Generating Product Intelligence for dataset={dataset_id}")

        # 1. Retrieve clusters and trends
        issue_clusters = tools.get_issue_clusters(workspace_id=workspace_id, dataset_id=dataset_id)
        feature_clusters = tools.get_feature_clusters(workspace_id=workspace_id, dataset_id=dataset_id)
        trends = tools.get_trends(workspace_id=workspace_id, dataset_id=dataset_id)

        if not issue_clusters and not feature_clusters:
            logger.warning(f"Agent 3: No clusters found for dataset={dataset_id}")
            return {
                "workspace_id": workspace_id,
                "dataset_id": dataset_id,
                "insights": [],
                "insights_count": 0,
                "status": "completed",
            }

        total_records = sum(c.get("frequency", 0) for c in issue_clusters) or 10

        # 2. Generate baseline structured insights with deterministic priority scoring
        candidate_insights = insight_service.generate_insights_from_clusters(
            issue_clusters=issue_clusters,
            feature_clusters=feature_clusters,
            trends=trends,
            workspace_id=workspace_id,
            dataset_id=dataset_id,
            total_records=total_records,
        )

        # 3. If Gemini is available, enhance summaries and recommended actions
        if gemini_client.is_available and candidate_insights:
            try:
                from app.utils.serialization import serialize_documents
                clean_issues = serialize_documents(issue_clusters[:5])
                clean_features = serialize_documents(feature_clusters[:5])
                clean_trends = serialize_documents(trends[:5])
                prompt = prompt_manager.build_product_intelligence_prompt(
                    issue_clusters=clean_issues,
                    feature_clusters=clean_features,
                    trends=clean_trends,
                )
                llm_response = gemini_client.generate_json(
                    prompt=prompt,
                    system_instruction=self.backstory,
                )
                if llm_response and "insights" in llm_response:
                    llm_insights = llm_response["insights"]
                    # Merge enhanced titles/recommendations while preserving evidence and deterministic scores
                    for i, base_ins in enumerate(candidate_insights):
                        if i < len(llm_insights):
                            enhanced = llm_insights[i]
                            if enhanced.get("title"):
                                base_ins["title"] = enhanced["title"]
                            if enhanced.get("summary"):
                                base_ins["summary"] = enhanced["summary"]
                            if enhanced.get("recommended_action"):
                                base_ins["recommended_action"] = enhanced["recommended_action"]
                            if enhanced.get("affected_feature"):
                                base_ins["affected_feature"] = enhanced["affected_feature"]
                            if enhanced.get("business_impact"):
                                base_ins["business_impact"] = enhanced["business_impact"]
                            if enhanced.get("feature_opportunity"):
                                base_ins["feature_opportunity"] = enhanced["feature_opportunity"]
                            if enhanced.get("product_recommendation"):
                                base_ins["product_recommendation"] = enhanced["product_recommendation"]
                            if enhanced.get("root_cause"):
                                base_ins["root_cause"] = enhanced["root_cause"]
                            if enhanced.get("recommended_next_steps"):
                                base_ins["recommended_next_steps"] = enhanced["recommended_next_steps"]
                            if enhanced.get("customer_impact") and isinstance(enhanced["customer_impact"], dict):
                                base_ins["customer_impact"] = enhanced["customer_impact"]
            except Exception as e:
                logger.warning(f"Agent 3 Gemini enhancement error: {e}. Using deterministic product insights.")

        # 4. Validate each insight against Pydantic schema and save to MongoDB
        validated_insights = []
        for ins in candidate_insights:
            # Ensure mandatory evidence
            if not ins.get("evidence_record_ids"):
                logger.warning(f"Rejecting insight {ins.get('insight_id')} due to missing customer evidence.")
                continue

            is_valid, validated_model, errors = tools.validate_product_insight(ins)
            if is_valid and validated_model is not None:
                insight_dict = validated_model.model_dump()
                insight_dict["workspace_id"] = workspace_id
                insight_dict["dataset_id"] = dataset_id
                insight_dict["analysis_version"] = analysis_version
                tools.save_product_insight(insight_dict)
                validated_insights.append(insight_dict)
            else:
                logger.warning(f"Insight validation failed: {errors}")

        logger.info(f"Agent 3 completed: saved {len(validated_insights)} product insights.")

        return {
            "workspace_id": workspace_id,
            "dataset_id": dataset_id,
            "insights": validated_insights,
            "insights_count": len(validated_insights),
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
                "tools": tools.CREW_AGENT_3_TOOLS,
                "verbose": True,
                "allow_delegation": False,
            }
            if llm is not None:
                agent_kwargs["llm"] = llm
            return Agent(**agent_kwargs)
        except ImportError:
            logger.debug("CrewAI is not installed; ProductIntelligenceAgent operates via native execution.")
            return None


product_intelligence_agent = ProductIntelligenceAgent()

