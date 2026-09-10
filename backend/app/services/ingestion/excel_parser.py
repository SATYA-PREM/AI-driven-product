from __future__ import annotations

import io
from datetime import datetime
import openpyxl
from app.services.ingestion.file_parser import FileParser
from app.core.exceptions import FileProcessingError

class ExcelParser(FileParser):
    """Parser for Excel (XLSX) files."""

    def parse(self, file_bytes: bytes) -> list[dict]:
        """Parse the first sheet of an Excel file into a list of dictionaries."""
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            sheet = wb.active
            if not sheet:
                raise FileProcessingError("No active sheet found in Excel file.")

            rows = list(sheet.iter_rows(values_only=True))
            if not rows or len(rows) < 2:
                return []

            # Extract headers, fallback to col_X if empty
            headers = [str(h).strip() if h is not None else f"col_{i}" for i, h in enumerate(rows[0])]
            
            records = []
            for row in rows[1:]:
                # Skip entirely empty rows
                if all(cell is None for cell in row):
                    continue
                    
                record = {}
                for i, cell in enumerate(row):
                    if i < len(headers):
                        val = cell
                        if isinstance(val, datetime):
                            val = val.isoformat()
                        record[headers[i]] = val
                records.append(record)

            return records

        except Exception as e:
            raise FileProcessingError(f"Failed to parse Excel file: {str(e)}")

excel_parser = ExcelParser()
