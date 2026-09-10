"""
logging.py
-----------
Structured logging configuration with request-ID correlation.
Uses stdlib logging with a JSON-like structured formatter.
"""

from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

# Context variable for request-scoped data
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")


class StructuredFormatter(logging.Formatter):
    """Formatter that outputs structured log records with context variables."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now(timezone.utc).isoformat()
        request_id = request_id_var.get("")
        user_id = user_id_var.get("")

        # Build structured log line
        parts = [
            f"[{timestamp}]",
            f"[{record.levelname}]",
        ]

        if request_id:
            parts.append(f"[req:{request_id[:8]}]")
        if user_id:
            parts.append(f"[user:{user_id[:8]}]")

        parts.append(f"[{record.name}]")
        parts.append(record.getMessage())

        if record.exc_info and record.exc_info[1]:
            parts.append(f"| exception={record.exc_info[1]}")

        return " ".join(parts)


def setup_logging(debug: bool = False) -> None:
    """
    Configure application-wide logging.

    Args:
        debug: If True, set log level to DEBUG. Otherwise INFO.
    """
    level = logging.DEBUG if debug else logging.INFO

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates on reload
    root_logger.handlers.clear()

    # Console handler with structured formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(handler)

    # Quieten noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger for a module.

    Usage:
        from app.core.logging import get_logger
        logger = get_logger(__name__)
        logger.info("Something happened")
    """
    return logging.getLogger(name)
