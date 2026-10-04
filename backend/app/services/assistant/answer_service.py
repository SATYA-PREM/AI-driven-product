"""
answer_service.py
-----------------
Synthesizes and normalizes Assistant responses, formats structured cards, and attaches source references.
"""

from __future__ import annotations
import re
from typing import Any, Dict, List, Optional
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnswerService:
    """Formats final responses for the UI layer."""

    def format_sources(self, raw_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Cleans and deduplicates source references."""
        seen = set()
        formatted = []
        for s in raw_sources:
            sid = str(s.get("id", "")).strip()
            if sid and sid not in seen:
                seen.add(sid)
                formatted.append({
                    "type": s.get("type", "insight"),
                    "id": sid,
                    "title": s.get("title"),
                    "quote": s.get("quote"),
                    "score": s.get("score"),
                    "source": s.get("source"),
                })
        return formatted


answer_service = AnswerService()

