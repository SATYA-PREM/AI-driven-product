"""
Unit tests for Auth, Password, Token, and Permission Services.
"""

from app.services.auth.password_service import PasswordService
from app.services.auth.token_service import TokenService
from app.core.permissions import has_permission, get_role_permissions
from app.core.constants import UserRole, Permission


def test_password_hashing_and_verification():
    password = "SecurePassword123!"
    hashed = PasswordService.hash_password(password)
    assert hashed != password
    assert PasswordService.verify_password(password, hashed) is True
    assert PasswordService.verify_password("WrongPassword", hashed) is False


def test_password_strength_validation():
    valid, errors = PasswordService.validate_password_strength("Short1")
    assert valid is False
    assert any("at least 8 characters" in e for e in errors)

    valid, errors = PasswordService.validate_password_strength("validpass123")
    assert valid is False  # Missing uppercase
    assert any("uppercase" in e for e in errors)

    valid, errors = PasswordService.validate_password_strength("ValidPassword123")
    assert valid is True
    assert len(errors) == 0


def test_jwt_token_generation_and_decoding():
    token = TokenService.create_access_token(
        user_id="user_12345",
        email="test@example.com",
        role=UserRole.PM.value
    )
    assert isinstance(token, str)

    payload = TokenService.decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user_12345"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == UserRole.PM.value


def test_rbac_permission_matrix():
    # PM permissions
    assert has_permission(UserRole.PM, Permission.CREATE_WORKSPACE) is True
    assert has_permission(UserRole.PM, Permission.UPLOAD_DATASET) is True
    assert has_permission(UserRole.PM, Permission.RUN_PIPELINE) is True
    assert has_permission(UserRole.PM, Permission.MANAGE_MEMBERS) is True

    # Member permissions
    assert has_permission(UserRole.MEMBER, Permission.CREATE_WORKSPACE) is False
    assert has_permission(UserRole.MEMBER, Permission.UPLOAD_DATASET) is False
    assert has_permission(UserRole.MEMBER, Permission.RUN_PIPELINE) is False
    assert has_permission(UserRole.MEMBER, Permission.VIEW_DATASET) is True
    assert has_permission(UserRole.MEMBER, Permission.VIEW_WORKSPACE) is True

