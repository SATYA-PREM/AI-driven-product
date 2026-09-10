from __future__ import annotations

import json
from app.services.ingestion.file_parser import FileParser
from app.core.exceptions import FileProcessingError

class JSONParser(FileParser):
    """Parser for JSON and JSONL files."""

    def parse(self, file_bytes: bytes) -> list[dict]:
        """Parse JSON or JSONL into a list of dictionaries."""
        content = file_bytes.decode('utf-8', errors='replace')
        content_strip = content.strip()

        if not content_strip:
            return []

        # Attempt standard JSON first
        try:
            data = json.loads(content_strip)
            if isinstance(data, list):
                return [item for item in data if isinstance(item, dict)]
            elif isinstance(data, dict):
                return [data]
            else:
                raise FileProcessingError("JSON root must be an array or object.")
        except json.JSONDecodeError:
            pass

        # Attempt JSONL parsing
        records = []
        for line in content_strip.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if isinstance(obj, dict):
                    records.append(obj)
            except json.JSONDecodeError as e:
                raise FileProcessingError(f"Invalid JSON/JSONL format: {e}")

        if not records:
            raise FileProcessingError("Failed to parse JSON content or no dict records found.")

        return records

JsonParser = JSONParser
json_parser = JSONParser()
