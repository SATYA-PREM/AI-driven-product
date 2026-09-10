"""
Integration test for the full end-to-end data pipeline:
Upload -> Validation -> Cleaning -> Preprocessing -> AI-Ready Canonical Signals.
"""

from app.services.ingestion.csv_parser import csv_parser
from app.services.validation.schema_validator import schema_validator
from app.services.validation.data_validator import data_validator
from app.services.validation.business_rule_validator import business_rule_validator
from app.services.cleaning.duplicate_handler import duplicate_handler
from app.services.cleaning.missing_value_handler import missing_value_handler
from app.services.cleaning.normalization import normalizer
from app.services.preprocessing.text_preprocessor import text_preprocessor
from app.services.preprocessing.structured_preprocessor import structured_preprocessor
from app.services.preprocessing.feature_preparation import feature_preparation
from app.services.preprocessing.canonicalizer import canonicalizer
from app.core.constants import SourceType


def test_full_data_transformation_flow():
    # 1. Raw CSV Content
    raw_csv = (
        b"customer_id,rating,feedback,date\n"
        b"C001,5,Excellent user experience!,2026-08-20\n"
        b"C002,2,App crashes often.,2026-08-21\n"
        b"C001,5,Excellent user experience!,2026-08-20\n"  # Duplicate
        b"C003,9,Invalid rating row,2026-08-22\n"  # Invalid
    )

    # 2. Ingestion / Parse
    records = csv_parser.parse(raw_csv)
    assert len(records) == 4

    # 3. Validation
    valid_records = []
    for idx, rec in enumerate(records):
        s_ok, _ = schema_validator.validate_schema(rec, SourceType.FEEDBACK.value)
        d_ok, _, _ = data_validator.validate_data(rec, SourceType.FEEDBACK.value)
        b_ok, _ = business_rule_validator.validate_business_rules(rec, SourceType.FEEDBACK.value)
        if s_ok and d_ok and b_ok:
            valid_records.append(rec)

    assert len(valid_records) == 3  # Invalid rating dropped

    # 4. Cleaning & Deduplication
    deduped = duplicate_handler.detect_duplicates(valid_records, text_field="feedback")
    handled = missing_value_handler.handle_missing_values(deduped, SourceType.FEEDBACK.value)
    
    cleaned = []
    for rec in handled:
        norm = normalizer.normalize_record(rec, SourceType.FEEDBACK.value)
        cleaned.append(norm)

    assert len(cleaned) == 3
    assert cleaned[2]["is_duplicate"] is True

    # 5. Preprocessing & Canonicalization
    canonical_signals = []
    for rec in cleaned:
        rec["feedback"] = text_preprocessor.preprocess_text(rec["feedback"])
        structured = structured_preprocessor.preprocess_structured(rec, SourceType.FEEDBACK.value)
        structured["features"] = feature_preparation.prepare_features(structured)

        signal = canonicalizer.canonicalize(
            record=structured,
            source_type=SourceType.FEEDBACK.value,
            dataset_id="ds_test_100",
            workspace_id="ws_test_100",
            product_id="prod_test_100"
        )
        canonical_signals.append(signal)

    assert len(canonical_signals) == 3
    assert canonical_signals[0]["text"] == "excellent user experience!"
    assert canonical_signals[0]["rating"] == 5
    assert canonical_signals[0]["customer_id"] == "C001"
    assert "signal_id" in canonical_signals[0]

