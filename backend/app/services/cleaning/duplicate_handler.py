from __future__ import annotations
from app.utils.text_utils import compute_text_hash


class DuplicateHandler:
    """Handler for detecting duplicate records within a batch/dataset."""

    def detect_duplicates(self, records: list[dict], text_field: str = "feedback") -> list[dict]:
        seen_hashes = {}
        results = []

        for record in records:
            rec_copy = dict(record)
            text = str(rec_copy.get(text_field) or "")
            text_hash = compute_text_hash(text)

            if text_hash in seen_hashes and text:
                rec_copy["is_duplicate"] = True
                rec_copy["duplicate_group"] = seen_hashes[text_hash]
            else:
                group_id = str(rec_copy.get("_id", f"group_{text_hash[:8]}"))
                if text:
                    seen_hashes[text_hash] = group_id
                rec_copy["is_duplicate"] = False
                rec_copy["duplicate_group"] = group_id

            results.append(rec_copy)

        return results


duplicate_handler = DuplicateHandler()
detect_duplicates = duplicate_handler.detect_duplicates
