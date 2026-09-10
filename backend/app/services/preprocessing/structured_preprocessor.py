from __future__ import annotations


class StructuredPreprocessor:
    """Standardizes fields, data types, and identifiers across sources."""

    def preprocess_structured(self, record: dict, source_type: str) -> dict:
        processed = dict(record)
        st = source_type.lower() if isinstance(source_type, str) else source_type.value

        if st == "review" and "review_text" in processed:
            processed["text"] = processed.get("review_text")
        elif st == "support_ticket" and "description" in processed:
            processed["text"] = processed.get("description")
        elif st == "feedback" and "feedback" in processed:
            processed["text"] = processed.get("feedback")

        if "rating" in processed and processed["rating"] is not None and str(processed["rating"]).strip() != "":
            try:
                processed["rating"] = int(float(processed["rating"]))
            except (ValueError, TypeError):
                pass

        return processed


structured_preprocessor = StructuredPreprocessor()
preprocess_structured = structured_preprocessor.preprocess_structured
