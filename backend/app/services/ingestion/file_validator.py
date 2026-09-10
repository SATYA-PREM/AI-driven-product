from __future__ import annotations

import os
import re
from app.core.constants import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES


class FileValidator:
    """Service for validating uploaded files for ingestion."""

    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    @staticmethod
    def validate_file(filename: str, file_size: int, content_bytes: bytes) -> tuple[bool, list[str]]:
        """
        Validate file extension, size, empty contents, and name safety.
        Returns (is_valid, list_of_errors).
        """
        errors = []

        # Normalize extensions (e.g. '.csv' or 'csv')
        ext = os.path.splitext(filename)[1].lower()
        allowed_normalized = {e.lower() if e.startswith('.') else f".{e.lower()}" for e in ALLOWED_EXTENSIONS}

        if ext not in allowed_normalized:
            errors.append(f"File extension '{ext}' is not allowed. Allowed: {', '.join(sorted(allowed_normalized))}")

        # Check size
        if file_size > FileValidator.MAX_FILE_SIZE_BYTES:
            errors.append(f"File size exceeds maximum allowed size of {FileValidator.MAX_FILE_SIZE_BYTES} bytes.")

        # Check empty
        if not content_bytes or len(content_bytes) == 0:
            errors.append("File is empty.")

        # Check filename safety
        basename = os.path.basename(filename)
        if re.search(r'[<>:"|?*]', basename):
            errors.append("Filename contains invalid characters.")

        return len(errors) == 0, errors


file_validator = FileValidator()
