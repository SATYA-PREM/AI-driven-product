from __future__ import annotations
from app.utils.date_utils import is_valid_date


class DataValidator:
    """Validator for data quality and value constraints."""

    def validate_data(self, record: dict, source_type: str) -> tuple[bool, list[str], list[str]]:
        errors = []
        warnings = []

        if "rating" in record and record["rating"] is not None and str(record["rating"]).strip() != "":
            try:
                rating = float(record["rating"])
                if not (1 <= rating <= 5):
                    errors.append(f"Rating must be between 1 and 5, got {rating}")
            except (ValueError, TypeError):
                pass  # Caught by schema_validator

        text_fields = [k for k in record.keys() if "text" in k or k in ["feedback", "description"]]
        for tf in text_fields:
            val = record.get(tf)
            if val and isinstance(val, str):
                if len(val.strip()) < 3:
                    warnings.append(f"Text field '{tf}' is very short")

        if "date" in record and record["date"] and str(record["date"]).strip() != "":
            if not is_valid_date(str(record["date"])):
                errors.append(f"Date '{record['date']}' is not in a recognized date format")

        is_valid = len(errors) == 0
        return is_valid, errors, warnings


data_validator = DataValidator()
validate_data = data_validator.validate_data
