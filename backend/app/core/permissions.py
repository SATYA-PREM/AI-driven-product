"""
permissions.py
---------------
RBAC permission definitions and checking utilities.

Maps each role to its allowed actions. The permission_service
uses this to enforce access control.
"""

from __future__ import annotations

from app.core.constants import Permission, UserRole


# ──────────────────────────────────────────────
# Role → Permission mapping
# ──────────────────────────────────────────────

ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.PM: {
        # Workspace
        Permission.CREATE_WORKSPACE,
        Permission.VIEW_WORKSPACE,
        Permission.UPDATE_WORKSPACE,
        Permission.DELETE_WORKSPACE,
        Permission.MANAGE_MEMBERS,
        # Product
        Permission.CREATE_PRODUCT,
        Permission.VIEW_PRODUCT,
        Permission.UPDATE_PRODUCT,
        # Data
        Permission.UPLOAD_DATASET,
        Permission.VIEW_DATASET,
        Permission.DELETE_DATASET,
        Permission.RUN_PIPELINE,
        # Intelligence
        Permission.VIEW_INTELLIGENCE,
        # PM-specific
        Permission.GENERATE_PRD,
        Permission.ASSIGN_TASKS,
        Permission.VALIDATE_PLAN,
        # Tasks
        Permission.COMPLETE_TASK,
        Permission.VIEW_TASKS,
        # QA
        Permission.MANAGE_TESTS,
        Permission.EXECUTE_TESTS,
        Permission.MANAGE_DEFECTS,
        Permission.VERIFY_DEFECTS,
        Permission.GENERATE_QA_REPORT,
        # Stakeholder
        Permission.VIEW_STAKEHOLDER_DASHBOARD,
        Permission.SUBMIT_BUSINESS_FEEDBACK,
        Permission.APPROVE_DECISION,
        Permission.REJECT_DECISION,
        Permission.REQUEST_CHANGES,
        Permission.VIEW_DECISIONS,
        Permission.VIEW_BUSINESS_METRICS,
    },
    UserRole.MEMBER: {
        # Workspace (read-only)
        Permission.VIEW_WORKSPACE,
        # Product (read-only)
        Permission.VIEW_PRODUCT,
        # Data (read-only)
        Permission.VIEW_DATASET,
        # Intelligence
        Permission.VIEW_INTELLIGENCE,
        # Tasks
        Permission.COMPLETE_TASK,
        Permission.VIEW_TASKS,
        # QA
        Permission.MANAGE_TESTS,
        Permission.EXECUTE_TESTS,
        Permission.MANAGE_DEFECTS,
        Permission.VERIFY_DEFECTS,
        Permission.GENERATE_QA_REPORT,
        # Stakeholder
        Permission.VIEW_STAKEHOLDER_DASHBOARD,
        Permission.SUBMIT_BUSINESS_FEEDBACK,
        Permission.APPROVE_DECISION,
        Permission.REJECT_DECISION,
        Permission.REQUEST_CHANGES,
        Permission.VIEW_DECISIONS,
        Permission.VIEW_BUSINESS_METRICS,
    },
}


def normalize_role(role: UserRole | str | None) -> UserRole:
    """Normalize any role string representation to a valid UserRole enum."""
    if isinstance(role, UserRole):
        return role
    if not role or not isinstance(role, str):
        return UserRole.MEMBER
    
    r = role.strip().lower().replace(" ", "_").replace("-", "_")
    if r in ["pm", "product_manager", "productmanager", "owner", "admin", "lead"]:
        return UserRole.PM
    return UserRole.MEMBER


def has_permission(role: UserRole | str | None, permission: Permission) -> bool:
    """
    Check whether a role has a specific permission.

    Args:
        role: The user's role (as enum or string).
        permission: The action to check.

    Returns:
        True if the role is permitted to perform the action.
    """
    normalized_role = normalize_role(role)
    allowed = ROLE_PERMISSIONS.get(normalized_role, set())
    return permission in allowed


def get_role_permissions(role: UserRole | str | None) -> set[Permission]:
    """
    Get all permissions for a given role.

    Args:
        role: The user's role.

    Returns:
        Set of permitted actions.
    """
    normalized_role = normalize_role(role)
    return ROLE_PERMISSIONS.get(normalized_role, set())
