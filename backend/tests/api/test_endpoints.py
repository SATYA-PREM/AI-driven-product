"""
API endpoint tests for Health, Auth, Workspaces, Datasets, Jobs, and Workflows.
"""

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "name" in data


def test_health_endpoints(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data

    response_v1 = client.get("/api/v1/health")
    assert response_v1.status_code == 200
    data_v1 = response_v1.json()
    assert "status" in data_v1


def test_unauthorized_access_fails(client):
    # Trying to access protected route without token
    response = client.get("/api/v1/workspaces")
    assert response.status_code in (401, 403)


def test_get_current_user_profile(client, monkeypatch):
    from app.services.auth.auth_service import AuthService
    from app.services.auth.token_service import TokenService

    fake_user = {
        "_id": "6a9811a27f6c15efc946df18",
        "id": "6a9811a27f6c15efc946df18",
        "name": "Test User",
        "email": "user@example.com",
        "role": "user",
        "is_active": True
    }
    monkeypatch.setattr(AuthService, "get_user_by_id", lambda user_id: fake_user)

    token = TokenService.create_access_token("6a9811a27f6c15efc946df18", "user@example.com", "user")
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "6a9811a27f6c15efc946df18"
    assert data["email"] == "user@example.com"
    assert data["name"] == "Test User"
    assert data["is_active"] is True

