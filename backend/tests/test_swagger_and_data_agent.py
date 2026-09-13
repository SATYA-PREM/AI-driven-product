"""
test_swagger_and_data_agent.py
------------------------------
Tests verifying:
1. Swagger/OpenAPI schema tag ordering follows the exact chronological pipeline lifecycle.
2. The AI Agents health probe reports all agents (Data Agent + 3 Milestone 2 Agents) as working.
3. Data Agent dirty data preprocessing endpoints are registered and operational.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_openapi_tags_sequential_order(client):
    """Verify that OpenAPI schema defines all 8 phases in exact chronological sequence."""
    openapi_schema = app.openapi()
    tags = [t["name"] for t in openapi_schema.get("tags", [])]

    expected_tags = [
        "1. Authentication & Users",
        "2. Workspaces & Products",
        "3. Data Ingestion & Datasets",
        "4. Data Agent - Dirty Data Preprocessing",
        "5. AI Agents & Health Probes",
        "6. AI Analysis Pipeline (CrewAI 3-Agent Flow)",
        "7. Product Intelligence & PM Dashboard",
        "8. Background Jobs & System Monitoring",
    ]

    assert tags == expected_tags, f"Expected tags {expected_tags}, got {tags}"


def test_openapi_endpoints_tagged_correctly():
    """Verify that every endpoint path is mapped to one of the sequential numbered tags."""
    openapi_schema = app.openapi()
    paths = openapi_schema.get("paths", {})

    # Check key endpoints
    assert "/api/v1/health/agents" in paths
    agents_tags = paths["/api/v1/health/agents"]["get"]["tags"]
    assert "5. AI Agents & Health Probes" in agents_tags

    assert "/api/v1/data-agent/datasets/{dataset_id}/pipeline" in paths
    pipeline_tags = paths["/api/v1/data-agent/datasets/{dataset_id}/pipeline"]["post"]["tags"]
    assert "4. Data Agent - Dirty Data Preprocessing" in pipeline_tags

    assert "/api/v1/datasets/{dataset_id}/clean" in paths
    clean_tags = paths["/api/v1/datasets/{dataset_id}/clean"]["post"]["tags"]
    assert "4. Data Agent - Dirty Data Preprocessing" in clean_tags

    assert "/api/v1/datasets/{dataset_id}/preprocess" in paths
    preprocess_tags = paths["/api/v1/datasets/{dataset_id}/preprocess"]["post"]["tags"]
    assert "4. Data Agent - Dirty Data Preprocessing" in preprocess_tags

    assert "/api/v1/datasets/{dataset_id}/analysis" in paths
    analysis_tags = paths["/api/v1/datasets/{dataset_id}/analysis"]["post"]["tags"]
    assert "6. AI Analysis Pipeline (CrewAI 3-Agent Flow)" in analysis_tags

    assert "/api/v1/datasets/{dataset_id}/analyses" in paths
    analyses_tags = paths["/api/v1/datasets/{dataset_id}/analyses"]["get"]["tags"]
    assert "6. AI Analysis Pipeline (CrewAI 3-Agent Flow)" in analyses_tags

    assert "/api/v1/workspaces/{workspace_id}/intelligence/summary" in paths
    intel_tags = paths["/api/v1/workspaces/{workspace_id}/intelligence/summary"]["get"]["tags"]
    assert "7. Product Intelligence & PM Dashboard" in intel_tags


def test_agents_health_probe_reports_all_agents_working(client):
    """Verify the /api/v1/health/agents probe returns operational status for Data Agent + 3 Milestone 2 Agents."""
    response = client.get("/api/v1/health/agents")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ready"
    assert data["all_agents_working"] is True

    # 1. Data Agent (Dirty Data Preprocessor)
    assert "data_agent" in data["agents"]
    data_agent_info = data["agents"]["data_agent"]
    assert data_agent_info["working"] is True
    assert data_agent_info["status"] == "active_and_working"
    assert data_agent_info["tools_count"] >= 4
    assert "clean_dataset" in data_agent_info["pipeline_stages"]

    # 2. Agent 1 (Feedback Analysis Agent)
    assert "agent_1_feedback_analysis" in data["agents"]
    agent1 = data["agents"]["agent_1_feedback_analysis"]
    assert agent1["working"] is True
    assert agent1["status"] == "active_and_working"
    assert "sentiment" in agent1["dimensions_evaluated"]

    # 3. Agent 2 (Pattern & Trend Agent)
    assert "agent_2_pattern_trend" in data["agents"]
    agent2 = data["agents"]["agent_2_pattern_trend"]
    assert agent2["working"] is True
    assert agent2["status"] == "active_and_working"
    assert "semantic_issue_clustering" in agent2["capabilities"]

    # 4. Agent 3 (Product Intelligence Agent)
    assert "agent_3_product_intelligence" in data["agents"]
    agent3 = data["agents"]["agent_3_product_intelligence"]
    assert agent3["working"] is True
    assert agent3["status"] == "active_and_working"
    assert "deterministic_priority_scoring" in agent3["capabilities"]


def test_data_agent_tools_listing(client, monkeypatch):
    """Verify data agent tools listing endpoint returns catalog of preprocessing tools."""
    from app.services.auth.auth_service import AuthService
    from app.services.auth.token_service import TokenService

    fake_user = {
        "_id": "6a9811a27f6c15efc946df18",
        "id": "6a9811a27f6c15efc946df18",
        "name": "Test User",
        "email": "user@example.com",
        "role": "admin",
        "is_active": True,
    }
    monkeypatch.setattr(AuthService, "get_user_by_id", lambda user_id: fake_user)
    token = TokenService.create_access_token("6a9811a27f6c15efc946df18", "user@example.com", "admin")

    response = client.get("/api/v1/data-agent/tools", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    tools = response.json()
    assert len(tools) >= 5
    tool_names = [t["name"] for t in tools]
    assert "inspect_dataset" in tool_names
    assert "clean_dataset" in tool_names
    assert "preprocess_dataset" in tool_names
    assert "validate_dataset" in tool_names


def test_get_dataset_records(client, monkeypatch):
    """Verify get_dataset_records returns records and their IDs."""
    from app.services.auth.auth_service import AuthService
    from app.services.auth.token_service import TokenService
    from app.repositories.dataset_repository import dataset_repository
    from app.repositories.data_repository import data_repository

    fake_user = {
        "_id": "6a9811a27f6c15efc946df18",
        "id": "6a9811a27f6c15efc946df18",
        "name": "Test User",
        "email": "user@example.com",
        "role": "pm",
        "is_active": True,
    }
    monkeypatch.setattr(AuthService, "get_user_by_id", lambda user_id: fake_user)
    token = TokenService.create_access_token("6a9811a27f6c15efc946df18", "user@example.com", "pm")

    # Mock dataset
    ds = {
        "_id": "ds_test_rec_1",
        "workspace_id": "ws_test_rec",
        "name": "Test Dataset",
    }
    monkeypatch.setattr(dataset_repository, "get_by_id", lambda did: ds)
    monkeypatch.setattr(
        data_repository,
        "get_raw_records",
        lambda did, skip=0, limit=100: [
            {
                "_id": "raw_rec_001",
                "dataset_id": did,
                "source_record_id": "CUST_991",
                "row_number": 1,
                "original_record": {"feedback": "Great checkout flow"},
            }
        ],
    )

    response = client.get(
        "/api/v1/datasets/ds_test_rec_1/records?stage=raw",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["id"] == "raw_rec_001"
    assert records[0]["source_record_id"] == "CUST_991"
