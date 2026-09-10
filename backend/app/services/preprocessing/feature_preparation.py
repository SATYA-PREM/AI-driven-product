from __future__ import annotations


class FeaturePreparation:
    """Extracts basic semantic and statistical feature metadata from records."""

    def prepare_features(self, record: dict) -> dict:
        features = {}
        text = str(record.get("text") or record.get("feedback") or record.get("review_text") or record.get("description") or "")

        features["text_length"] = len(text)
        features["word_count"] = len(text.split()) if text else 0
        features["has_rating"] = "rating" in record and record["rating"] is not None

        return features


feature_preparation = FeaturePreparation()
prepare_features = feature_preparation.prepare_features
