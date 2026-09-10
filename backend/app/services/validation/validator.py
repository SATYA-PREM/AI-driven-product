# Legacy CSV-specific validator.
# For the new multi-format pipeline, use validation_service.py instead.
"""
validator.py
--------------
Validation answers one question per row: "is this row usable?"
It never modifies data -- it only checks it and reports problems.
(Fixing problems is cleaner.py's job, one step later.)

This example validates the ShopEase feedback shape:
    customer_id, rating, feedback, date

If your CSV has different columns, change REQUIRED_FIELDS and the
checks inside validate_row() to match your data -- the pattern
(check required fields -> check types -> check ranges -> return
errors) stays the same for any CSV shape.
"""

REQUIRED_FIELDS = ["customer_id", "rating", "feedback", "date"]


def validate_row(row: dict) -> tuple[bool, list[str]]:
    """
    Checks one row (a dict, e.g. {"customer_id": "C001", "rating": "2", ...}).
    Returns (is_valid, list_of_error_messages).
    A row with ANY error is considered invalid as a whole.
    """
    errors = []

    # --- Check 1: required fields must exist and not be empty ---
    for field in REQUIRED_FIELDS:
        value = row.get(field)
        if value is None or str(value).strip() == "":
            errors.append(f"Missing required field: '{field}'")

    # If required fields are missing, don't bother checking types below --
    # we'd just get confusing secondary errors.
    if errors:
        return False, errors

    # --- Check 2: rating must be a whole number ---
    try:
        rating = int(row["rating"])
    except (ValueError, TypeError):
        errors.append(f"'rating' must be a whole number, got: '{row['rating']}'")
        return False, errors

    # --- Check 3: rating must be in the allowed range (business rule) ---
    if not (1 <= rating <= 5):
        errors.append(f"'rating' must be between 1 and 5, got: {rating}")

    # --- Check 4: feedback text shouldn't be suspiciously short ---
    if len(row["feedback"].strip()) < 3:
        errors.append("'feedback' text is too short to be meaningful")

    is_valid = len(errors) == 0
    return is_valid, errors


def validate_rows(rows: list[dict]) -> dict:
    """
    Validates every row in the batch and also checks for duplicates
    across rows (a row-vs-row check, which is why it lives here at the
    batch level rather than inside validate_row).

    Returns a summary dict plus the per-row results, e.g.:
        {
            "total": 10, "valid": 8, "invalid": 1, "duplicates": 1,
            "quality_score": 80.0,
            "results": [
                {"row_number": 1, "row": {...}, "is_valid": True, "errors": []},
                {"row_number": 2, "row": {...}, "is_valid": False, "errors": ["..."]},
                ...
            ]
        }
    """
    seen_keys = set()
    results = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for i, row in enumerate(rows, start=1):
        # Duplicate check: same customer_id + same feedback text seen before.
        dedup_key = (row.get("customer_id"), row.get("feedback"))
        if dedup_key in seen_keys:
            duplicate_count += 1
            results.append({
                "row_number": i, "row": row, "is_valid": False,
                "errors": ["Duplicate of an earlier row in this file"],
            })
            continue
        seen_keys.add(dedup_key)

        is_valid, errors = validate_row(row)
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        results.append({"row_number": i, "row": row, "is_valid": is_valid, "errors": errors})

    total = len(rows)
    quality_score = round((valid_count / total) * 100, 2) if total > 0 else 0.0

    return {
        "total": total,
        "valid": valid_count,
        "invalid": invalid_count,
        "duplicates": duplicate_count,
        "quality_score": quality_score,
        "results": results,
    }
