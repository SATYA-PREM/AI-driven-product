from __future__ import annotations

from typing import Protocol
from app.core.constants import FileFormat
from app.core.exceptions import FileProcessingError

class FileParser(Protocol):
    """Interface for file parsers."""
    
    def parse(self, file_bytes: bytes) -> list[dict]:
        """Parse raw bytes into a list of dictionaries."""
        ...

_parsers: dict[FileFormat, FileParser] = {}

def register_parser(file_format: FileFormat, parser: FileParser) -> None:
    """Register a specific FileParser for a FileFormat."""
    _parsers[file_format] = parser

def get_parser(file_format: FileFormat) -> FileParser:
    """Retrieve the appropriate parser for the file format."""
    parser = _parsers.get(file_format)
    if not parser:
        raise FileProcessingError(f"No parser found for format: {file_format}")
    return parser
