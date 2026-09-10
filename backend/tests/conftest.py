"""
conftest.py
------------
Global pytest fixtures and test setup.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_pm_token():
    """Valid JWT token for a test PM user."""
    return create_access_token(
        user_id="65f1a2b3c4d5e6f7a8b9c0d1",
        email="pm@example.com",
        role="pm"
    )


@pytest.fixture
def test_member_token():
    """Valid JWT token for a test Member user."""
    return create_access_token(
        user_id="65f1a2b3c4d5e6f7a8b9c0d2",
        email="member@example.com",
        role="member"
    )


@pytest.fixture
def auth_headers_pm(test_pm_token):
    """Authorization headers for PM."""
    return {"Authorization": f"Bearer {test_pm_token}"}


@pytest.fixture
def auth_headers_member(test_member_token):
    """Authorization headers for Member."""
    return {"Authorization": f"Bearer {test_member_token}"}

