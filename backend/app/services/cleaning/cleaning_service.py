from __future__ import annotations
from datetime import datetime, timezone

from app.repositories.data_repository import data_repository
from app.repositories.validation_repository import validation_repository
from app.repositories.dataset_repository import dataset_repository
from app.models.cleaned_data import CleanedDataModel
from app.services.cleaning.duplicate_handler import duplicate_handler
from app.services.cleaning.missing_value_handler import missing_value_handler
from app.services.cleaning.normalization import normalizer
from app.core.constants import DatasetStatus
from app.core.exceptions import NotFoundError


class CleaningService:
    """Service for cleaning and normalizing dataset records."""

    @staticmethod
    def clean_dataset(dataset_id: str, workspace_id: str, user_id: str = "") -> dict:
        """
        Orchestrates the cleaning pipeline.
        """
        dataset = dataset_repository.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundError("Dataset", dataset_id)

        source_type = dataset.get("source_type", "feedback")
        product_id = dataset.get("product_id", "")

        val_summary = validation_repository.get_by_dataset(dataset_id)
        valid_row_numbers = set()
        if val_summary and "record_results" in val_summary:
            for r in val_summary["record_results"]:
                if r.get("status") in ["valid", "warning"]:
                    valid_row_numbers.add(r.get("row_number"))

        raw_records = data_repository.get_raw_records(dataset_id, limit=50000)

        # Filter valid records if validation was run, otherwise clean all
        if valid_row_numbers:
            valid_raw_records = [r for r in raw_records if r.get("row_number") in valid_row_numbers]
        else:
            valid_raw_records = raw_records

        data_list = [r.get("original_record") or r.get("data") or r for r in valid_raw_records]

        text_field = "feedback"
        if source_type.lower() == "review":
            text_field = "review_text"
        elif source_type.lower() == "support_ticket":
            text_field = "description"

        data_list = duplicate_handler.detect_duplicates(data_list, text_field)
        data_list = missing_value_handler.handle_missing_values(data_list, source_type)

        cleaned_docs = []
        dup_count = 0

        for raw_rec, data in zip(valid_raw_records, data_list):
            is_dup = data.get("is_duplicate", False)
            if is_dup:
                dup_count += 1

            cleaned_record = normalizer.normalize_record(data, source_type)
            doc = CleanedDataModel.create_document(
                dataset_id=dataset_id,
                workspace_id=workspace_id,
                product_id=product_id,
                source_record_id=str(raw_rec.get("source_record_id", "")),
                row_number=raw_rec.get("row_number", 0),
                cleaned_record=cleaned_record,
                is_duplicate=is_dup,
                duplicate_group=data.get("duplicate_group", "")
            )
            cleaned_docs.append(doc)

        if cleaned_docs:
            data_repository.insert_cleaned_records(cleaned_docs)

        dataset_repository.update_status(
            dataset_id,
            DatasetStatus.CLEANED.value,
            extra_fields={"updated_at": datetime.now(timezone.utc)}
        )

        return {
            "dataset_id": dataset_id,
            "total_input": len(valid_raw_records),
            "cleaned_count": len(cleaned_docs),
            "duplicate_count": dup_count,
            "cleaning_metadata": {"rules_applied": ["text_normalization", "date_normalization", "deduplication", "missing_value_imputation"]},
            "cleaned_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def get_cleaning_results(dataset_id: str) -> dict:
        """Get cleaning summary for a dataset."""
        count = data_repository.count_cleaned_records(dataset_id)
        return {
            "dataset_id": dataset_id,
            "total_input": count,
            "cleaned_count": count,
            "duplicate_count": 0,
            "cleaning_metadata": {},
            "cleaned_at": datetime.now(timezone.utc)
        }


cleaning_service = CleaningService()
