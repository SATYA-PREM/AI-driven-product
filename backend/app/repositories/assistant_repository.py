"""
assistant_repository.py
-----------------------
Repository for Assistant sessions and conversation messages.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.database import assistant_sessions_collection, assistant_messages_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


class AssistantRepository:
    """Manages chat sessions and conversation history."""

    def create_session(
        self,
        workspace_id: str,
        user_id: Optional[str] = None,
        category_id: Optional[str] = None,
        title: str = "New Assistant Session"
    ) -> Dict[str, Any]:
        """Create a new chat session."""
        doc = {
            "workspace_id": workspace_id,
            "user_id": user_id,
            "category_id": category_id or "all",
            "title": title,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        res = assistant_sessions_collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)
        return doc

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a session by ID."""
        try:
            doc = assistant_sessions_collection.find_one({"_id": ObjectId(session_id)})
            if doc:
                doc["id"] = str(doc.pop("_id"))
                return doc
        except Exception:
            pass
        return None

    def list_sessions(self, workspace_id: str, user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent sessions for a workspace and user."""
        query: Dict[str, Any] = {"workspace_id": workspace_id}
        if user_id:
            query["$or"] = [{"user_id": user_id}, {"user_id": None}]
        
        cursor = assistant_sessions_collection.find(query).sort("updated_at", -1).limit(limit)
        results = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return results

    def save_message(
        self,
        session_id: str,
        workspace_id: str,
        question: str,
        answer: str,
        user_id: Optional[str] = None,
        category_id: Optional[str] = None,
        mode: str = "FAST_RETRIEVAL",
        sources: Optional[List[Dict[str, Any]]] = None,
        structured_data: Optional[Dict[str, Any]] = None,
        confidence: float = 0.95,
    ) -> Dict[str, Any]:
        """Persist a conversation turn."""
        now = datetime.now(timezone.utc)
        
        doc = {
            "session_id": session_id,
            "workspace_id": workspace_id,
            "user_id": user_id,
            "category_id": category_id or "all",
            "question": question,
            "answer": answer,
            "mode": mode,
            "sources": sources or [],
            "structured_data": structured_data or {},
            "confidence": confidence,
            "created_at": now,
        }
        res = assistant_messages_collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)

        # Update session title and updated_at
        try:
            assistant_sessions_collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"updated_at": now, "title": question[:60]}}
            )
        except Exception:
            pass

        return doc

    def get_messages(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages in a session."""
        cursor = assistant_messages_collection.find({"session_id": session_id}).sort("created_at", 1).limit(limit)
        results = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return results


assistant_repository = AssistantRepository()

