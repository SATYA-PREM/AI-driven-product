"""
backfill_dataset_names.py
-------------------------
Migration script to backfill dataset_name and name fields for all existing datasets in MongoDB.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import db_manager, datasets_collection
from app.core.logging import get_logger

logger = get_logger("backfill_dataset_names")


def run_migration():
    logger.info("Starting dataset name backfill migration...")
    cursor = datasets_collection.find()
    total_found = 0
    updated_count = 0

    for doc in cursor:
        total_found += 1
        doc_id = doc["_id"]
        filename = doc.get("filename") or "dataset.csv"
        current_ds_name = doc.get("dataset_name")
        current_name = doc.get("name")

        # Determine target name
        target_name = current_ds_name or current_name or filename

        updates = {}
        if not current_ds_name or current_ds_name == "None":
            updates["dataset_name"] = target_name
        if not current_name or current_name == "None":
            updates["name"] = target_name

        if updates:
            datasets_collection.update_one({"_id": doc_id}, {"$set": updates})
            updated_count += 1
            print(f"Updated Dataset {doc_id}: set {updates}")

    print(f"\nMigration Complete: Inspected {total_found} datasets, updated {updated_count} datasets.")


if __name__ == "__main__":
    run_migration()

