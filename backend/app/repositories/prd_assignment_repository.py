"""
prd_assignment_repository.py
----------------------------
MongoDB repository for PRD Requirement Team Assignments and Audit History.
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional
from datetime import datetime, timezone

from app.repositories.base_repository import BaseRepository
from app.core.database import (
    prd_assignments_collection,
    prd_assignment_history_collection,
    users_collection,
)
from app.models.prd_assignment import PRDAssignmentHistoryModel


class PRDAssignmentRepository(BaseRepository):

    def __init__(self):
        super().__init__(prd_assignments_collection)

    def find_by_assignment_id(self, assignment_id: str) -> Optional[dict[str, Any]]:
        return prd_assignments_collection.find_one({"assignment_id": assignment_id})

    def list_assignments(
        self,
        workspace_id: str,
        prd_ids: Optional[List[str]] = None,
        category_id: Optional[str] = None,
        requirement_id: Optional[str] = None,
        user_id: Optional[str] = None,
        team_role: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[dict[str, Any]]:
        query: dict[str, Any] = {"workspace_id": str(workspace_id)}
        if prd_ids:
            query["prd_id"] = {"$in": [str(pid) for pid in prd_ids]}
        if category_id:
            query["category_id"] = str(category_id)
        if requirement_id:
            query["requirement_id"] = str(requirement_id)
        if user_id:
            query["user_id"] = str(user_id)
        if team_role:
            query["team_role"] = str(team_role)
        if status and status != "ALL":
            query["status"] = str(status)

        return list(prd_assignments_collection.find(query).sort("updated_at", -1))

    def save_assignment(self, assignment_doc: dict[str, Any]) -> str:
        req_id = assignment_doc["requirement_id"]
        user_id = assignment_doc["user_id"]
        role = assignment_doc["team_role"]

        existing = prd_assignments_collection.find_one({
            "requirement_id": req_id,
            "user_id": user_id,
            "team_role": role,
        })

        if existing:
            assignment_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            prd_assignments_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {k: v for k, v in assignment_doc.items() if k != "_id"}}
            )
            return existing.get("assignment_id", str(existing["_id"]))

        res = prd_assignments_collection.insert_one(assignment_doc)
        return assignment_doc.get("assignment_id", str(res.inserted_id))

    def update_assignment(
        self,
        assignment_id: str,
        updates: dict[str, Any],
        changed_by: str = "SYSTEM",
        reason: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        existing = self.find_by_assignment_id(assignment_id)
        if not existing:
            return None

        new_user = updates.get("user_id", existing.get("user_id"))
        new_role = updates.get("team_role", existing.get("team_role"))

        # Prevent duplicate key error if target user & role already exist on this requirement
        dup = prd_assignments_collection.find_one({
            "requirement_id": existing.get("requirement_id"),
            "user_id": new_user,
            "team_role": new_role,
        })
        if dup and dup.get("assignment_id") != assignment_id:
            prd_assignments_collection.delete_one({"_id": dup["_id"]})

        clean_updates = {k: v for k, v in updates.items() if k not in ["_id", "assignment_id"]}
        clean_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        prd_assignments_collection.update_one(
            {"assignment_id": assignment_id},
            {"$set": clean_updates}
        )

        # Log history if user or role changed
        new_user = updates.get("user_id", existing.get("user_id"))
        new_role = updates.get("team_role", existing.get("team_role"))
        action = "REASSIGNED" if new_user != existing.get("user_id") else "UPDATED"

        self.log_history(
            assignment_id=assignment_id,
            requirement_id=existing.get("requirement_id", ""),
            prd_id=existing.get("prd_id", ""),
            action=action,
            changed_by=changed_by,
            previous_user_id=existing.get("user_id"),
            new_user_id=new_user,
            team_role=new_role,
            method=existing.get("assignment_method", "MANUAL"),
            reason=reason or f"Assignment updated by {changed_by}",
        )

        return self.find_by_assignment_id(assignment_id)

    def delete_assignment(self, assignment_id: str, removed_by: str = "SYSTEM") -> bool:
        existing = self.find_by_assignment_id(assignment_id)
        if not existing:
            return False

        res = prd_assignments_collection.delete_one({"assignment_id": assignment_id})
        if res.deleted_count > 0:
            self.log_history(
                assignment_id=assignment_id,
                requirement_id=existing.get("requirement_id", ""),
                prd_id=existing.get("prd_id", ""),
                action="REMOVED",
                changed_by=removed_by,
                previous_user_id=existing.get("user_id"),
                new_user_id=None,
                team_role=existing.get("team_role"),
                method=existing.get("assignment_method", "MANUAL"),
                reason=f"Assignment removed by {removed_by}",
            )
            return True
        return False

    def log_history(
        self,
        assignment_id: str,
        requirement_id: str,
        prd_id: str,
        action: str,
        changed_by: str,
        previous_user_id: Optional[str] = None,
        new_user_id: Optional[str] = None,
        team_role: Optional[str] = None,
        method: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> str:
        doc = PRDAssignmentHistoryModel.create_document(
            assignment_id=assignment_id,
            requirement_id=requirement_id,
            prd_id=prd_id,
            action=action,
            changed_by=changed_by,
            previous_user_id=previous_user_id,
            new_user_id=new_user_id,
            team_role=team_role,
            method=method,
            reason=reason,
        )
        res = prd_assignment_history_collection.insert_one(doc)
        return str(res.inserted_id)

    def get_history(
        self,
        assignment_id: Optional[str] = None,
        requirement_id: Optional[str] = None,
        prd_id: Optional[str] = None,
    ) -> List[dict[str, Any]]:
        query: dict[str, Any] = {}
        if assignment_id:
            query["assignment_id"] = assignment_id
        if requirement_id:
            query["requirement_id"] = requirement_id
        if prd_id:
            query["prd_id"] = prd_id

        return list(prd_assignment_history_collection.find(query).sort("timestamp", -1))


prd_assignment_repository = PRDAssignmentRepository()

