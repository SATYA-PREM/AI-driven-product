from __future__ import annotations
from app.core.constants import SOURCE_TYPE_REQUIRED_FIELDS, SourceType


class SchemaValidator:
    """Validator for record structure against source type schemas."""

    def validate_schema(self, record: dict, source_type: str) -> tuple[bool, list[str]]:
        errors = []
        st_key = source_type.lower() if isinstance(source_type, str) else source_type.value
        
        # Try both SourceType enum and string lookup
        required_fields = SOURCE_TYPE_REQUIRED_FIELDS.get(st_key, [])
        if not required_fields:
            for enum_val, fields in SOURCE_TYPE_REQUIRED_FIELDS.items():
                if enum_val.value == st_key or enum_val.name.lower() == st_key:
                    required_fields = fields
                    break

        for field in required_fields:
            val = record.get(field)
            if val is None or str(val).strip() == "":
                errors.append(f"Missing or empty required field: '{field}'")

        # Check data types if present
        if "rating" in record and record["rating"] is not None and str(record["rating"]).strip() != "":
            try:
                float(record["rating"])
            except (ValueError, TypeError):
                errors.append(f"Rating must be numeric, got '{record['rating']}'")

        is_valid = len(errors) == 0
        return is_valid, errors


schema_validator = SchemaValidator()
validate_schema = schema_validator.validate_schema
