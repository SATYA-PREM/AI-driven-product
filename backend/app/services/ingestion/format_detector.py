from __future__ import annotations

import os
from app.core.constants import FileFormat
from app.core.exceptions import FileProcessingError

class FormatDetector:
    """Service for detecting file formats based on extension and content."""

    @staticmethod
    def detect_format(filename: str, content_bytes: bytes) -> FileFormat:
        """Detect the file format."""
        ext = os.path.splitext(filename)[1].lower().strip('.')

        # Validate content heuristics
        if ext == 'csv':
            sample = content_bytes[:1024].decode('utf-8', errors='ignore')
            if ',' in sample or ';' in sample or '\t' in sample:
                return FileFormat.CSV
            # Fallback if no comma found but still requested as csv
            return FileFormat.CSV
            
        elif ext == 'json':
            sample = content_bytes[:1024].decode('utf-8', errors='ignore').strip()
            if sample.startswith('[') or sample.startswith('{'):
                return FileFormat.JSON
                
        elif ext == 'xlsx':
            # XLSX files are ZIP files, should start with PK
            if content_bytes.startswith(b'PK\x03\x04'):
                return FileFormat.XLSX

        raise FileProcessingError(f"Unrecognized or invalid file format for extension '{ext}'")

format_detector = FormatDetector()
