"""
Unit tests for validator.py and cleaner.py -- these are pure
functions with no MongoDB involved, so they run instantly.

Run with:
    pytest tests/test_validator_and_cleaner.py -v
"""

from app.services.validation.validator import validate_row, validate_rows
from app.services.cleaning.cleaner import normalize_text, normalize_date, clean_row


# --- validator.py tests ---

def test_valid_row_passes():
    row = {"customer_id": "C001", "rating": "3", "feedback": "It works fine", "date": "2026-08-20"}
    is_valid, errors = validate_row(row)
    assert is_valid is True
    assert errors == []


def test_missing_field_fails():
    row = {"customer_id": "C001", "rating": "3", "feedback": "", "date": "2026-08-20"}
    is_valid, errors = validate_row(row)
    assert is_valid is False
    assert "feedback" in errors[0]


def test_out_of_range_rating_fails():
    row = {"customer_id": "C001", "rating": "9", "feedback": "great app", "date": "2026-08-20"}
    is_valid, errors = validate_row(row)
    assert is_valid is False
    assert "between 1 and 5" in errors[0]


def test_non_numeric_rating_fails():
    row = {"customer_id": "C001", "rating": "great", "feedback": "great app", "date": "2026-08-20"}
    is_valid, errors = validate_row(row)
    assert is_valid is False


def test_validate_rows_detects_duplicates():
    rows = [
        {"customer_id": "C001", "rating": "3", "feedback": "good app", "date": "2026-08-20"},
        {"customer_id": "C001", "rating": "3", "feedback": "good app", "date": "2026-08-20"},
    ]
    summary = validate_rows(rows)
    assert summary["total"] == 2
    assert summary["duplicates"] == 1
    assert summary["valid"] == 1


# --- cleaner.py tests ---

def test_normalize_text_lowercases_and_strips_exclamations():
    assert normalize_text("VERY SLOW CHECKOUT!!!") == "very slow checkout"


def test_normalize_date_converts_us_format():
    assert normalize_date("08/20/2026") == "2026-08-20"


def test_clean_row_produces_expected_shape():
    row = {"customer_id": " C001 ", "rating": "3", "feedback": "GREAT APP!!!", "date": "08/20/2026"}
    cleaned = clean_row(row)
    assert cleaned == {
        "customer_id": "C001",
        "rating": 3,
        "feedback": "great app",
        "date": "2026-08-20",
    }
