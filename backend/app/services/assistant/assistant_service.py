"""
assistant_service.py
--------------------
Master Orchestrator Service for the AI Assistant.
Enforces:
1. Conversational intent detection: Normal interactions do NOT query MongoDB.
2. Project POV analysis: Only queries MongoDB when project data/insights/PRDs are asked.
3. Multi-turn conversation memory across both conversational and project questions.
4. Graceful workspace resolution without crashing on missing or invalid workspace IDs.
"""

from __future__ import annotations
import uuid
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.services.assistant.authorization_service import authorization_service
from app.services.assistant.query_service import query_service
from app.services.assistant.context_service import context_service
from app.services.assistant.answer_service import answer_service
from app.agents.assistant_agent.agent import assistant_agent
from app.repositories.assistant_repository import assistant_repository
from app.repositories.assistant_job_repository import assistant_job_repository
from app.core.database import workspaces_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Core entrypoint for the AI Assistant."""

    def _resolve_workspace_id(self, workspace_id: Optional[str], user_id: Optional[str] = None) -> Optional[str]:
        """Resolves a valid workspace ID, gracefully falling back to existing workspaces in MongoDB."""
        from bson import ObjectId

        # 1. If a valid, non-default workspace_id was passed, check if it exists in MongoDB
        if workspace_id and workspace_id not in ["default-ws", "default-workspace", "ws_demo_01", "none", "null"]:
            try:
                ws = None
                try:
                    ws = workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
                except Exception:
                    pass
                if not ws:
                    ws = workspaces_collection.find_one({"id": workspace_id})
                if ws:
                    return str(ws.get("_id") or ws.get("id"))
            except Exception as e:
                logger.warning(f"Error checking workspace {workspace_id}: {e}")

        # 2. Fallback: Find first valid workspace in collection
        try:
            ws = workspaces_collection.find_one({})
            if ws:
                return str(ws.get("_id") or ws.get("id"))
        except Exception as e:
            logger.warning(f"Error querying fallback workspace: {e}")

        return None

    def _is_normal_conversational_interaction(self, message: str, history: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Determines whether a message is normal conversational chit-chat, a greeting, or general inquiry
        that does NOT require MongoDB data access.
        """
        clean = message.strip().lower()
        if not clean:
            return True

        words = re.findall(r'\b[a-z0-9\']+\b', clean)
        word_count = len(words)
        clean_text = " ".join(words)

        # 1. Greetings (single or short phrase)
        greetings = {
            "hi", "hello", "hey", "hola", "howdy", "sup", "yo", "heya",
            "good morning", "good afternoon", "good evening", "greetings"
        }
        if clean_text in greetings or clean in greetings:
            return True
        if word_count <= 2 and words and words[0] in greetings:
            return True

        # 2. Common pleasantries & status inquiries
        pleasantries = [
            "how are you", "how are you doing", "how r u", "hows it going",
            "how is it going", "how are things", "whats up", "what is up",
            "nice to meet you", "pleased to meet you", "good to see you"
        ]
        if any(p in clean_text for p in pleasantries):
            return True

        # 3. Identity and meta questions
        identity_queries = [
            "who are you", "what are you", "what is your name", "who made you",
            "what can you do", "introduce yourself", "tell me about yourself",
            "how do you work", "help me", "what can i ask", "what can you help"
        ]
        if any(q in clean_text for q in identity_queries):
            return True

        # 4. Politeness & acknowledgements
        politeness = [
            "thank you", "thanks", "thanks a lot", "thank you so much", "thx",
            "cool", "awesome", "great", "nice", "ok", "okay", "got it",
            "understood", "bye", "goodbye", "see you", "see ya"
        ]
        if clean_text in politeness or (word_count <= 3 and any(p in clean_text for p in politeness)):
            return True

        # 5. Explicit project keywords override: if any project keyword is mentioned, it is NOT conversational
        project_terms = [
            "insight", "feedback", "prd", "requirement", "feature", "issue", "bug",
            "customer", "pain point", "complaint", "sentiment", "user story",
            "acceptance criteria", "metric", "trend", "dataset", "batch", "roadmap",
            "workspace", "highest priority", "checkout", "payment", "login", "auth"
        ]
        if any(term in clean_text for term in project_terms):
            return False

        # 6. Check if previous turn was a project entity and current turn is a short follow-up
        if history and word_count <= 7:
            followup_words = ["detail", "more", "why", "elaborate", "explain", "first", "second", "third", "above", "mentioned", "that", "this"]
            if any(w in words for w in followup_words):
                last_turn = history[-1]
                last_text = (last_turn.get("text") or last_turn.get("question") or "").lower()
                if any(pt in last_text for pt in project_terms):
                    return False

        # 7. General concept questions (e.g., "what is agile", "what is scrum", "tell me a joke")
        general_concepts = ["agile", "scrum", "kanban", "sprint", "joke", "poem", "story", "weather"]
        if any(gc in clean_text for gc in general_concepts):
            return True

        # Very short casual message (< 4 words) without project terms
        if word_count <= 3:
            return True

        return False

    def process_query(
        self,
        workspace_id: Optional[str] = None,
        message: str = "",
        user_id: Optional[str] = None,
        category_id: Optional[str] = "all",
        session_id: Optional[str] = None,
        scope: Optional[str] = "all",
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Processes a user question with multi-turn memory:
        1. Multi-turn History Assembly
        2. Intent Check: Normal Conversational interactions bypass MongoDB.
        3. Project Data Analysis: Queries MongoDB only when project insights/PRDs are requested.
        4. Session persistence.
        """
        # 1. Assemble multi-turn conversation history
        merged_history: List[Dict[str, Any]] = []
        if history and isinstance(history, list):
            for h in history:
                if isinstance(h, dict) and (h.get("text") or h.get("question") or h.get("answer")):
                    merged_history.append(h)

        # Retrieve stored session history if available
        if session_id:
            try:
                db_messages = assistant_repository.get_messages(session_id=session_id, limit=10)
                if db_messages and not merged_history:
                    for m in db_messages:
                        merged_history.append({
                            "role": "user",
                            "text": m.get("question", ""),
                        })
                        merged_history.append({
                            "role": "assistant",
                            "text": m.get("answer", ""),
                            "sources": m.get("sources", []),
                        })
            except Exception as e:
                logger.debug(f"Could not load db messages for session {session_id}: {e}")

        # 2. Check if this is a Normal Conversational interaction
        is_conversational = self._is_normal_conversational_interaction(message, merged_history)

        if is_conversational:
            logger.info("AI Assistant executing Normal Conversational Turn (skipping MongoDB).")
            # Answer conversationally with memory
            convo_result = assistant_agent.answer_conversational_turn(message=message, history=merged_history)

            msg_id = f"msg-{uuid.uuid4().hex[:12]}"
            effective_session_id = session_id or f"sess-{uuid.uuid4().hex[:12]}"

            # Attempt best-effort session logging without breaking if no workspace
            effective_ws = self._resolve_workspace_id(workspace_id, user_id) or "conversational-ws"
            try:
                if not session_id:
                    session = assistant_repository.create_session(
                        workspace_id=effective_ws,
                        user_id=user_id,
                        category_id=category_id,
                        title=message[:50]
                    )
                    effective_session_id = session.get("id") or effective_session_id

                assistant_repository.save_message(
                    session_id=effective_session_id,
                    workspace_id=effective_ws,
                    user_id=user_id,
                    category_id=category_id,
                    question=message,
                    answer=convo_result["answer"],
                    mode="CONVERSATIONAL",
                    sources=[],
                    structured_data=None,
                    confidence=1.0,
                )
            except Exception as e:
                logger.debug(f"Non-critical: session persist skipped for conversational turn: {e}")

            return {
                "session_id": effective_session_id,
                "message_id": msg_id,
                "answer": convo_result["answer"],
                "sources": [],
                "confidence": 1.0,
                "mode": "CONVERSATIONAL",
                "structured_data": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        # 3. Project POV Analysis required: Resolve workspace and check MongoDB
        effective_ws_id = self._resolve_workspace_id(workspace_id, user_id)
        if not effective_ws_id:
            logger.warning("Project data requested but no workspace exists in MongoDB.")
            return {
                "session_id": session_id or f"sess-{uuid.uuid4().hex[:12]}",
                "message_id": f"msg-{uuid.uuid4().hex[:12]}",
                "answer": "I'm ready to analyze your product intelligence, customer feedback, and PRDs! However, no active workspace or customer dataset was found. Please select or create a workspace and upload a customer feedback dataset to begin.",
                "sources": [],
                "confidence": 0.9,
                "mode": "FAST_RETRIEVAL",
                "structured_data": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        # Verify access for the effective workspace
        try:
            authorization_service.verify_workspace_access(user_id=user_id, workspace_id=effective_ws_id)
            authorization_service.verify_category_access(user_id=user_id, workspace_id=effective_ws_id, category_id=category_id)
        except PermissionError as pe:
            logger.warning(f"Workspace authorization failed for {effective_ws_id}: {pe}")
            # Fall back to public project response
            effective_ws_id = self._resolve_workspace_id(None, None) or effective_ws_id

        # Session check / creation
        if not session_id:
            try:
                session = assistant_repository.create_session(
                    workspace_id=effective_ws_id,
                    user_id=user_id,
                    category_id=category_id,
                    title=message[:50]
                )
                session_id = session.get("id") or f"sess-{uuid.uuid4().hex[:12]}"
            except Exception:
                session_id = f"sess-{uuid.uuid4().hex[:12]}"

        # Check if message is a short contextual follow-up turn
        clean_msg = message.lower().strip()
        is_followup = bool(merged_history) and (
            len(clean_msg.split()) <= 7
            and any(w in clean_msg for w in ["detail", "more", "why", "elaborate", "explain", "that", "this", "it", "first", "second", "third", "above", "mentioned"])
        )

        # Fast-Path Intent Matcher (only if not a contextual follow-up)
        fast_path = None if is_followup else query_service.classify_fast_path(message)
        if fast_path:
            domain, intent = fast_path
            logger.info(f"AI Assistant matched Fast-Path: domain={domain}, intent={intent}")
            result = query_service.execute_fast_path(
                domain=domain,
                intent=intent,
                workspace_id=effective_ws_id,
                category_id=category_id
            )
        else:
            # Dynamic Analysis Path using MongoDB data and multi-turn memory
            logger.info(f"AI Assistant executing Dynamic Analysis Path (history_turns={len(merged_history)})")
            result = assistant_agent.answer_dynamic_question(
                workspace_id=effective_ws_id,
                question=message,
                category_id=category_id,
                scope=scope,
                history=merged_history,
            )

        # Persist message in repository
        msg_id = f"msg-{uuid.uuid4().hex[:12]}"
        created_at = datetime.now(timezone.utc).isoformat()
        try:
            msg_doc = assistant_repository.save_message(
                session_id=session_id,
                workspace_id=effective_ws_id,
                user_id=user_id,
                category_id=category_id,
                question=message,
                answer=result["answer"],
                mode=result.get("mode", "DYNAMIC_ANALYSIS"),
                sources=result.get("sources", []),
                structured_data=result.get("structured_data", {}),
                confidence=result.get("confidence", 0.95),
            )
            msg_id = msg_doc.get("id") or msg_id
            created_at = msg_doc.get("created_at") or created_at
        except Exception as e:
            logger.debug(f"Non-critical: could not save message doc: {e}")

        return {
            "session_id": session_id,
            "message_id": msg_id,
            "answer": result["answer"],
            "sources": result.get("sources", []),
            "confidence": result.get("confidence", 0.95),
            "mode": result.get("mode", "DYNAMIC_ANALYSIS"),
            "structured_data": result.get("structured_data"),
            "created_at": created_at,
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
        effective_ws = self._resolve_workspace_id(workspace_id, user_id) or workspace_id
        authorization_service.verify_workspace_access(user_id=user_id, workspace_id=effective_ws)
        job = assistant_job_repository.create_job(
            workspace_id=effective_ws,
            question=message,
            user_id=user_id,
            category_id=category_id,
        )
        return job

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve async job status."""
        return assistant_job_repository.get_job(job_id)


assistant_service = AssistantService()


