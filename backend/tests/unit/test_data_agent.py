"""
Unit tests for Data Agent tools and orchestration capabilities.
"""

from app.agents.data_agent.agent import data_agent


def test_data_agent_tool_listing():
    tools = data_agent.list_tools()
    assert len(tools) > 0
    tool_names = [t["name"] for t in tools]
    assert "inspect_dataset" in tool_names
    assert "validate_dataset" in tool_names
    assert "clean_dataset" in tool_names
    assert "preprocess_dataset" in tool_names
    assert "get_job_status" in tool_names
    assert "get_dataset_summary" in tool_names

