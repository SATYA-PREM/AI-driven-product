"""
Unit tests for Pipeline Services: Validation, Cleaning, Normalization, Preprocessing, and Canonicalization.
"""

from app.services.validation.schema_validator import SchemaValidator
from app.services.validation.data_validator import DataValidator
from app.services.validation.business_rule_validator import BusinessRuleValidator
from app.services.cleaning.duplicate_handler import DuplicateHandler
from app.services.cleaning.missing_value_handler import MissingValueHandler
from app.services.cleaning.normalization import Normalizer
from app.services.preprocessing.text_preprocessor import TextPreprocessor
from app.services.preprocessing.canonicalizer import Canonicalizer
from app.core.constants import SourceType


def test_schema_and_business_rule_validation():
    schema_val = SchemaValidator()
    data_val = DataValidator()
    biz_val = BusinessRuleValidator()

    # Valid feedback row
    row = {"customer_id": "C101", "rating": "4", "feedback": "Great customer support", "date": "2026-08-20"}
    is_valid, errors = schema_val.validate_schema(row, SourceType.FEEDBACK.value)
    assert is_valid is True
    assert len(errors) == 0

    is_valid, errors, warnings = data_val.validate_data(row, SourceType.FEEDBACK.value)
    assert is_valid is True

    is_valid, errors = biz_val.validate_business_rules(row, SourceType.FEEDBACK.value)
    assert is_valid is True

    # Invalid rating (> 5)
    invalid_row = {"customer_id": "C101", "rating": "9", "feedback": "Too high", "date": "2026-08-20"}
    is_valid, errors, _ = data_val.validate_data(invalid_row, SourceType.FEEDBACK.value)
    assert is_valid is False
    assert any("between 1 and 5" in e for e in errors)


def test_duplicate_handler():
    handler = DuplicateHandler()
    records = [
        {"customer_id": "C01", "feedback": "Fast shipping"},
        {"customer_id": "C02", "feedback": "Slow checkout"},
        {"customer_id": "C01", "feedback": "Fast shipping"},  # Duplicate
    ]
    processed = handler.detect_duplicates(records, text_field="feedback")
    assert len(processed) == 3
    assert processed[0]["is_duplicate"] is False
    assert processed[1]["is_duplicate"] is False
    assert processed[2]["is_duplicate"] is True


def test_normalizer_and_text_preprocessor():
    normalizer = Normalizer()
    preprocessor = TextPreprocessor()

    raw_text = "   VERY SLOW CHECKOUT!!! <script>alert(1)</script>  "
    cleaned = normalizer.normalize_record({"feedback": raw_text, "date": "08/20/2026", "rating": "4"}, SourceType.FEEDBACK.value)
    
    assert cleaned["date"] == "2026-08-20"
    assert cleaned["rating"] == 4

    preprocessed_text = preprocessor.preprocess_text(cleaned["feedback"])
    assert "alert" not in preprocessed_text
    assert "<script>" not in preprocessed_text
    assert "very slow checkout" in preprocessed_text


def test_canonicalizer():
    canonicalizer = Canonicalizer()
    record = {
        "customer_id": "C555",
        "feedback": "Outstanding UI design",
        "rating": 5,
        "date": "2026-08-20"
    }

    signal = canonicalizer.canonicalize(
        record=record,
        source_type=SourceType.FEEDBACK.value,
        dataset_id="ds_123",
        workspace_id="ws_123",
        product_id="prod_123"
    )

    assert signal["dataset_id"] == "ds_123"
    assert signal["workspace_id"] == "ws_123"
    assert signal["customer_id"] == "C555"
    assert signal["text"] == "Outstanding UI design"
    assert signal["rating"] == 5
    assert signal["source_type"] == SourceType.FEEDBACK.value
    assert "signal_id" in signal

