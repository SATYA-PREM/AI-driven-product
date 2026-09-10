from __future__ import annotations
from app.utils.date_utils import normalize_date
from app.utils.text_utils import normalize_whitespace


class Normalizer:
    """Normalizer for fields including dates, ratings, and strings."""

    def normalize_record(self, record: dict, source_type: str = "") -> dict:
        cleaned = dict(record)

        if "date" in cleaned and cleaned["date"]:
            cleaned["date"] = normalize_date(str(cleaned["date"]))

        if "rating" in cleaned and cleaned["rating"] is not None and str(cleaned["rating"]).strip() != "":
            try:
                cleaned["rating"] = int(float(cleaned["rating"]))
            except (ValueError, TypeError):
                pass

        for k, v in cleaned.items():
            if isinstance(v, str):
                cleaned[k] = normalize_whitespace(v)

        return cleaned


normalizer = Normalizer()
normalize_record = normalizer.normalize_record
