# Legacy CSV pipeline. For the new multi-format pipeline,
# use ingestion_service + validation_service + cleaning_service instead.
"""
pipeline.py
--------------
This is the file that runs the whole flow, step by step:

    1. Parse the uploaded CSV into a list of row dictionaries
    2. Create a "batch" document (a receipt for this upload)
    3. Store EVERY raw row into raw_data (untouched, exactly as uploaded)
    4. Validate every row (validator.py)
    5. Clean only the rows that passed validation (cleaner.py)
    6. Store the cleaned rows into cleaned_data (separate collection)
    7. Update the batch document with final counts

Read this file after you've read validator.py and cleaner.py -- it's
where those two pieces actually get used.
"""

import csv
import io
import uuid
from datetime import datetime

from app.core.database import batches_col, raw_data_col, cleaned_data_col
from app.services.validation.validator import validate_rows
from app.services.cleaning.cleaner import clean_rows


def parse_csv(file_bytes: bytes) -> list[dict]:
    """
    Turns the raw bytes of an uploaded CSV file into a list of plain
    Python dictionaries -- one dict per row, keyed by the column
    headers from the CSV's first line.
    """
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def run_pipeline(filename: str, file_bytes: bytes) -> dict:
    """
    Runs the full pipeline on one uploaded CSV file and returns a
    summary you can show the user (or return from an API endpoint).
    """
    batch_id = str(uuid.uuid4())

    # --- Step 1: parse the CSV into rows ---
    rows = parse_csv(file_bytes)

    # --- Step 2: create the batch "receipt" document ---
    batches_col.insert_one({
        "_id": batch_id,
        "filename": filename,
        "uploaded_at": datetime.utcnow(),
        "total_rows": len(rows),
        "status": "PARSED",
    })

    # --- Step 3: store EVERY raw row, untouched, tagged with batch_id ---
    # This is your "raw data folder" -- a permanent, unmodified copy.
    raw_docs = []
    for i, row in enumerate(rows, start=1):
        raw_docs.append({
            "_id": f"{batch_id}_raw_{i}",
            "batch_id": batch_id,
            "row_number": i,
            "data": row,                      # the untouched row, exactly as read from the CSV
            "stored_at": datetime.utcnow(),
        })
    if raw_docs:
        raw_data_col.insert_many(raw_docs)

    batches_col.update_one({"_id": batch_id}, {"$set": {"status": "RAW_STORED"}})

    # --- Step 4: validate every row ---
    validation_summary = validate_rows(rows)

    # --- Step 5: clean only the rows that passed validation ---
    valid_rows = [r["row"] for r in validation_summary["results"] if r["is_valid"]]
    cleaned_rows = clean_rows(valid_rows)

    # --- Step 6: store cleaned rows in a SEPARATE collection ---
    # This is your "cleaned data folder" -- notice it can have FEWER
    # documents than raw_data, since invalid/duplicate rows were dropped.
    cleaned_docs = []
    for i, row in enumerate(cleaned_rows, start=1):
        cleaned_docs.append({
            "_id": f"{batch_id}_clean_{i}",
            "batch_id": batch_id,
            "data": row,                      # the cleaned, normalized row
            "cleaned_at": datetime.utcnow(),
        })
    if cleaned_docs:
        cleaned_data_col.insert_many(cleaned_docs)

    # --- Step 7: update the batch document with final results ---
    batches_col.update_one(
        {"_id": batch_id},
        {"$set": {
            "status": "CLEANED",
            "total_rows": validation_summary["total"],
            "valid_rows": validation_summary["valid"],
            "invalid_rows": validation_summary["invalid"],
            "duplicate_rows": validation_summary["duplicates"],
            "quality_score": validation_summary["quality_score"],
            "cleaned_row_count": len(cleaned_docs),
        }},
    )

    return {
        "batch_id": batch_id,
        "filename": filename,
        "total_rows": validation_summary["total"],
        "valid_rows": validation_summary["valid"],
        "invalid_rows": validation_summary["invalid"],
        "duplicate_rows": validation_summary["duplicates"],
        "quality_score": validation_summary["quality_score"],
        "raw_rows_stored": len(raw_docs),
        "cleaned_rows_stored": len(cleaned_docs),
        "row_errors": [
            {"row_number": r["row_number"], "errors": r["errors"]}
            for r in validation_summary["results"] if not r["is_valid"]
        ],
    }
