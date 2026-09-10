"""
agent.py
---------
Data Agent for the Product Intelligence platform.

The Data Agent orchestrates the data pipeline by calling tool functions
that delegate to backend services. It can work with or without a
Gemini API key — when no key is available, it provides a direct
tool-calling interface without LLM orchestration.

Architecture:
    User → Data Agent → Tools → Services → Repositories → MongoDB
"""

from __future__ import annotations

from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import NotFoundError, PipelineError
from app.agents.data_agent.prompts import DATA_AGENT_SYSTEM_PROMPT
from app.agents.data_agent import tools

logger = get_logger(__name__)


class DataAgent:
    """
    Data Agent that orchestrates the data pipeline.

    In Milestone 1, the agent provides a programmatic interface
    to the pipeline tools. Gemini-based natural language orchestration
    will be added in Milestone 2.
    """

    def __init__(self):
        self.has_gemini = bool(settings.GEMINI_API_KEY)
        self._tools = {
            "inspect_dataset": tools.inspect_dataset,
            "get_job_status": tools.get_job_status,
            "get_dataset_summary": tools.get_dataset_summary,
            "validate_dataset": tools.validate_dataset,
            "clean_dataset": tools.clean_dataset,
            "preprocess_dataset": tools.preprocess_dataset,
        }

    def execute_tool(self, tool_name: str, **kwargs: Any) -> dict:
        """
        Execute a named tool with the given arguments.

        Args:
            tool_name: Name of the tool to execute.
            **kwargs: Arguments to pass to the tool.

        Returns:
            Tool execution result.

        Raises:
            ValueError: If tool_name is not recognized.
        """
        if tool_name not in self._tools:
            raise ValueError(
                f"Unknown tool: {tool_name}. "
                f"Available tools: {list(self._tools.keys())}"
            )

        logger.info(f"Data Agent executing tool: {tool_name}")
        result = self._tools[tool_name](**kwargs)
        logger.info(f"Data Agent tool {tool_name} completed")
        return result

    def run_full_pipeline(
        self,
        dataset_id: str,
        workspace_id: str,
    ) -> dict:
        """
        Run the complete pipeline for a dataset:
        Validate → Clean → Preprocess

        This is the programmatic equivalent of what a Gemini-powered
        agent would do through natural language orchestration.

        Args:
            dataset_id: The dataset to process.
            workspace_id: The workspace context.

        Returns:
            Pipeline execution summary.
        """
        logger.info(f"Data Agent: running full pipeline for dataset={dataset_id}")

        results = {
            "dataset_id": dataset_id,
            "steps": {},
            "status": "running",
        }

        try:
            # Step 1: Inspect
            inspection = self.execute_tool(
                "inspect_dataset",
                dataset_id=dataset_id,
            )
            results["steps"]["inspect"] = {
                "status": "completed",
                "raw_count": inspection.get("raw_record_count", 0),
            }

            # Step 2: Validate
            validation = self.execute_tool(
                "validate_dataset",
                dataset_id=dataset_id,
                workspace_id=workspace_id,
            )
            results["steps"]["validation"] = {
                "status": "completed",
                "valid": validation.get("valid_count", 0),
                "invalid": validation.get("invalid_count", 0),
                "quality_score": validation.get("quality_score", 0.0),
            }

            # Step 3: Clean
            cleaning = self.execute_tool(
                "clean_dataset",
                dataset_id=dataset_id,
                workspace_id=workspace_id,
            )
            results["steps"]["cleaning"] = {
                "status": "completed",
                "cleaned_count": cleaning.get("cleaned_count", 0),
            }

            # Step 4: Preprocess
            preprocessing = self.execute_tool(
                "preprocess_dataset",
                dataset_id=dataset_id,
                workspace_id=workspace_id,
            )
            results["steps"]["preprocessing"] = {
                "status": "completed",
                "processed_count": preprocessing.get("processed_count", 0),
            }

            results["status"] = "completed"

            # Final summary
            summary = self.execute_tool(
                "get_dataset_summary",
                dataset_id=dataset_id,
            )
            results["summary"] = summary

            logger.info(f"Data Agent: pipeline completed for dataset={dataset_id}")

        except Exception as e:
            results["status"] = "failed"
            results["error"] = str(e)
            logger.error(f"Data Agent: pipeline failed for dataset={dataset_id}: {e}")

        return results

    def list_tools(self) -> list[dict]:
        """List all available tools with their descriptions."""
        from app.agents.data_agent.prompts import TOOL_DESCRIPTIONS
        return [
            {"name": name, "description": TOOL_DESCRIPTIONS.get(name, "")}
            for name in self._tools
        ]


# Module-level singleton
data_agent = DataAgent()
