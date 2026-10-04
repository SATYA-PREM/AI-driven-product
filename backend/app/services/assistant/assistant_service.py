"""
assistant_service.py
--------------------
Master Orchestrator Service for the AI Assistant.
Enforces:
1. Workspace / User Authorization
2. Fast-Path Intent Matching (20 Insight + 20 PRD Questions)
3. Dynamic Read-Only Gemini Fallback
4. History and Session Management
"""

from __future__ import annotations
import uuid
from typing import Any, Dict, List, Optional

from app.services.assistant.authorization_service import authorization_service
from app.services.assistant.query_service import query_service
from app.services.assistant.context_service import context_service
from app.services.assistant.answer_service import answer_service
from app.agents.assistant_agent.agent import assistant_agent
from app.repositories.assistant_repository import assistant_repository
from app.repositories.assistant_job_repository import assistant_job_repository
from app.core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Core entrypoint for the AI Assistant."""

    def process_query(
        self,
        workspace_id: str,
        message: str,
        user_id: Optional[str] = None,
        category_id: Optional[str] = "all",
        session_id: Optional[str] = None,
        scope: Optional[str] = "all",
    ) -> Dict[str, Any]:
        """
        Processes a user question synchronously:
        1. Authorization check
        2. Resolve or create session
        3. Fast-Path Question Bank check
        4. Dynamic Gemini Analysis if not fast-path
        5. Persist message and return structured response
        """
        # 1. Authorization check
        authorization_service.verify_workspace_access(user_id=user_id, workspace_id=workspace_id)
        authorization_service.verify_category_access(user_id=user_id, workspace_id=workspace_id, category_id=category_id)

        # 2. Session check / creation & load history
        history = []
        if not session_id:
            session = assistant_repository.create_session(
                workspace_id=workspace_id,
                user_id=user_id,
                category_id=category_id,
                title=message[:50]
            )
            session_id = session["id"]
        else:
            history = assistant_repository.get_messages(session_id=session_id, limit=10)

        # Check if message is a short contextual follow-up turn (e.g. "in detail", "tell me more", "why is that")
        clean_msg = message.lower().strip()
        is_followup = bool(history) and (
            len(clean_msg.split()) <= 6
            and any(w in clean_msg for w in ["detail", "more", "why", "elaborate", "explain", "that", "this", "it", "first", "second", "third", "above", "mentioned"])
        )

        # 3. Fast-Path Intent Matcher (only if not a contextual follow-up)
        fast_path = None if is_followup else query_service.classify_fast_path(message)
        if fast_path:
            domain, intent = fast_path
            logger.info(f"AI Assistant matched Fast-Path: domain={domain}, intent={intent}")
            result = query_service.execute_fast_path(
                domain=domain,
                intent=intent,
                workspace_id=workspace_id,
                category_id=category_id
            )
        else:
            # 4. Dynamic Path with conversation history memory
            logger.info(f"AI Assistant executing Dynamic Analysis Path (history_turns={len(history)})")
            result = assistant_agent.answer_dynamic_question(
                workspace_id=workspace_id,
                question=message,
                category_id=category_id,
                scope=scope,
                history=history,
            )

        # 5. Persist message in repository
        msg_doc = assistant_repository.save_message(
            session_id=session_id,
            workspace_id=workspace_id,
            user_id=user_id,
            category_id=category_id,
            question=message,
            answer=result["answer"],
            mode=result.get("mode", "FAST_RETRIEVAL"),
            sources=result.get("sources", []),
            structured_data=result.get("structured_data", {}),
            confidence=result.get("confidence", 0.95),
        )

        return {
            "session_id": session_id,
            "message_id": msg_doc["id"],
            "answer": result["answer"],
            "sources": result.get("sources", []),
            "confidence": result.get("confidence", 0.95),
            "mode": result.get("mode", "FAST_RETRIEVAL"),
            "structured_data": result.get("structured_data"),
            "created_at": msg_doc["created_at"],
        }

    def create_async_job(
        self,
        workspace_id: str,
        message: str,
        user_id: Optional[str] = None,
        category_id: Optional[str] = "all",
        scope: Optional[str] = "all",
    ) -> Dict[str, Any]:
        """Creates an async assistant job."""
        authorization_service.verify_workspace_access(user_id=user_id, workspace_id=workspace_id)
        job = assistant_job_repository.create_job(
            workspace_id=workspace_id,
            question=message,
            user_id=user_id,
            category_id=category_id,
        )
        return job

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve async job status."""
        return assistant_job_repository.get_job(job_id)


assistant_service = AssistantService()

