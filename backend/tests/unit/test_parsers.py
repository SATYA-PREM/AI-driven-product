"""
Unit tests for file parsers, format detector, and file validator.
"""

from app.services.ingestion.csv_parser import CsvParser
from app.services.ingestion.json_parser import JsonParser
from app.services.ingestion.format_detector import FormatDetector
from app.services.ingestion.file_validator import FileValidator
from app.core.constants import FileFormat


def test_csv_parser():
    csv_content = b"customer_id,rating,feedback,date\nC001,4,Great tool!,2026-08-20\nC002,1,Buggy,2026-08-21\n"
    parser = CsvParser()
    rows = parser.parse(csv_content)
    assert len(rows) == 2
    assert rows[0]["customer_id"] == "C001"
    assert rows[0]["rating"] == "4"
    assert rows[0]["feedback"] == "Great tool!"


def test_json_parser_array():
    json_content = b'[{"customer_id": "C001", "rating": 5, "feedback": "Superb"}, {"customer_id": "C002", "rating": 2, "feedback": "Slow"}]'
    parser = JsonParser()
    rows = parser.parse(json_content)
    assert len(rows) == 2
    assert rows[0]["customer_id"] == "C001"
    assert rows[1]["feedback"] == "Slow"


def test_json_parser_jsonl():
    jsonl_content = b'{"customer_id": "C001", "rating": 5}\n{"customer_id": "C002", "rating": 3}\n'
    parser = JsonParser()
    rows = parser.parse(jsonl_content)
    assert len(rows) == 2
    assert rows[0]["customer_id"] == "C001"
    assert rows[1]["rating"] == 3


def test_format_detector():
    detector = FormatDetector()
    
    fmt = detector.detect_format("feedback.csv", b"a,b,c\n1,2,3")
    assert fmt == FileFormat.CSV

    fmt = detector.detect_format("reviews.json", b'[{"id": 1}]')
    assert fmt == FileFormat.JSON

    fmt = detector.detect_format("sheet.xlsx", b"PK\x03\x04\x14\x00dummy-excel-bytes")
    assert fmt == FileFormat.XLSX


def test_file_validator():
    validator = FileValidator()

    # Valid file
    valid, errors = validator.validate_file("data.csv", 1024, b"customer_id,rating\nC1,5")
    assert valid is True
    assert len(errors) == 0

    # Disallowed extension
    valid, errors = validator.validate_file("malicious.exe", 1024, b"binary")
    assert valid is False
    assert any("not allowed" in e for e in errors)

    # Empty file
    valid, errors = validator.validate_file("empty.csv", 0, b"")
    assert valid is False
    assert any("empty" in e.lower() for e in errors)

