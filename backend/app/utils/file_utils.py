"""
file_utils.py
--------------
File handling utilities for uploads, temp files, and safe naming.
"""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path


def safe_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and other attacks.
    Replaces unsafe characters and prepends a UUID to ensure uniqueness.
    """
    # Remove path components
    name = os.path.basename(filename)

    # Replace unsafe characters with underscores
    name = re.sub(r'[^\w\-.]', '_', name)

    # Remove leading dots (hidden files)
    name = name.lstrip('.')

    # Ensure non-empty
    if not name:
        name = "unnamed_file"

    # Prepend UUID for uniqueness
    unique_prefix = uuid.uuid4().hex[:8]
    return f"{unique_prefix}_{name}"


def get_file_extension(filename: str) -> str:
    """
    Get the lowercase file extension including the dot.
    Returns '' if no extension found.
    """
    _, ext = os.path.splitext(filename)
    return ext.lower()


def get_file_size_mb(size_bytes: int) -> float:
    """Convert bytes to megabytes, rounded to 2 decimal places."""
    return round(size_bytes / (1024 * 1024), 2)


def ensure_directory(path: str | Path) -> Path:
    """Create a directory if it doesn't exist. Returns the Path object."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_upload_path(base_dir: str = "data/uploads") -> Path:
    """Get the uploads directory path, creating it if needed."""
    return ensure_directory(base_dir)


def get_temp_path(base_dir: str = "data/temporary") -> Path:
    """Get the temporary directory path, creating it if needed."""
    return ensure_directory(base_dir)


def get_export_path(base_dir: str = "data/exports") -> Path:
    """Get the exports directory path, creating it if needed."""
    return ensure_directory(base_dir)


def generate_temp_filename(extension: str = ".tmp") -> str:
    """Generate a unique temporary filename."""
    return f"tmp_{uuid.uuid4().hex}{extension}"
