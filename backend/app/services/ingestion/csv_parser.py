from __future__ import annotations

import csv
import io
from app.services.ingestion.file_parser import FileParser
from app.core.exceptions import FileProcessingError

class CSVParser(FileParser):
    """Parser for CSV files."""

    def parse(self, file_bytes: bytes) -> list[dict]:
        """Parse CSV bytes to list of dicts with encoding detection."""
        try:
            content = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content = file_bytes.decode('latin-1')
            except Exception as e:
                raise FileProcessingError(f"Failed to decode CSV: {str(e)}")

        if not content.strip():
            return []

        sniffer = csv.Sniffer()
        try:
            dialect = sniffer.sniff(content[:4096])
        except csv.Error:
            dialect = csv.excel

        try:
            reader = csv.DictReader(io.StringIO(content), dialect=dialect)
            return [row for row in reader]
        except Exception as e:
            raise FileProcessingError(f"Failed to parse CSV: {str(e)}")

CSVParser.parse_csv = CSVParser.parse
CsvParser = CSVParser
csv_parser = CSVParser()
