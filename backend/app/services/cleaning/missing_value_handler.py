from __future__ import annotations
from app.core.constants import SOURCE_TYPE_REQUIRED_FIELDS, SourceType


class MissingValueHandler:
    """Handler for managing missing required and optional fields."""

    def handle_missing_values(self, records: list[dict], source_type: str) -> list[dict]:
        st_key = source_type.lower() if isinstance(source_type, str) else source_type.value
        required_fields = SOURCE_TYPE_REQUIRED_FIELDS.get(st_key, [])
        if not required_fields:
            for enum_val, fields in SOURCE_TYPE_REQUIRED_FIELDS.items():
                if enum_val.value == st_key or enum_val.name.lower() == st_key:
                    required_fields = fields
                    break

        results = []
        for record in records:
            rec_copy = dict(record)
            for field in required_fields:
                if not rec_copy.get(field):
                    rec_copy["_missing_required"] = True

            for key in list(rec_copy.keys()):
                if rec_copy[key] == "":
                    rec_copy[key] = None

            results.append(rec_copy)

        return results


missing_value_handler = MissingValueHandler()
handle_missing_values = missing_value_handler.handle_missing_values
