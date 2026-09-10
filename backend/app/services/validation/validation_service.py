from __future__ import annotations
from datetime import datetime, timezone

from app.repositories.data_repository import data_repository
from app.repositories.validation_repository import validation_repository
from app.repositories.dataset_repository import dataset_repository
from app.models.validation import ValidationResultModel, ValidationRecordResult
from app.services.validation.schema_validator import schema_validator
from app.services.validation.data_validator import data_validator
from app.services.validation.business_rule_validator import business_rule_validator
from app.utils.text_utils import compute_text_hash
from app.core.constants import DatasetStatus, ValidationStatus
from app.core.exceptions import NotFoundError


class ValidationService:
    """Service for validating dataset records against schema and business rules."""

    @staticmethod
    def validate_dataset(dataset_id: str, workspace_id: str, user_id: str = "") -> dict:
        """
        Orchestrates full validation for a dataset.
        """
        dataset = dataset_repository.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundError("Dataset", dataset_id)

        source_type = dataset.get("source_type", "feedback")
        raw_records = data_repository.get_raw_records(dataset_id, limit=50000)

        seen_hashes = set()
        total = len(raw_records)
        valid_count = 0
        invalid_count = 0
        warning_count = 0
        duplicate_count = 0

        record_results = []

        for idx, record in enumerate(raw_records, start=1):
            record_id = str(record.get("_id", f"rec_{idx}"))
            row_num = record.get("row_number", idx)
            data = record.get("original_record") or record.get("data") or record

            is_schema_valid, schema_errors = schema_validator.validate_schema(data, source_type)
            is_data_valid, data_errors, data_warnings = data_validator.validate_data(data, source_type)
            is_biz_valid, biz_errors = business_rule_validator.validate_business_rules(data, source_type)

            all_errors = schema_errors + data_errors + biz_errors
            all_warnings = data_warnings

            # Duplicate check
            text_val = str(data.get("feedback") or data.get("review_text") or data.get("description") or "")
            if text_val:
                text_hash = compute_text_hash(text_val)
                if text_hash in seen_hashes:
                    duplicate_count += 1
                    all_errors.append("Duplicate of an earlier record in dataset")
                else:
                    seen_hashes.add(text_hash)

            if len(all_errors) > 0:
                rec_status = ValidationStatus.INVALID.value
                invalid_count += 1
            elif len(all_warnings) > 0:
                rec_status = ValidationStatus.WARNING.value
                valid_count += 1
                warning_count += 1
            else:
                rec_status = ValidationStatus.VALID.value
                valid_count += 1

            record_results.append(
                ValidationRecordResult.create_document(
                    record_id=record_id,
                    row_number=row_num,
                    status=rec_status,
                    errors=all_errors,
                    warnings=all_warnings
                )
            )

        quality_score = round((valid_count / total) * 100, 2) if total > 0 else 0.0

        val_doc = ValidationResultModel.create_document(
            dataset_id=dataset_id,
            workspace_id=workspace_id,
            total_records=total,
            valid_count=valid_count,
            invalid_count=invalid_count,
            warning_count=warning_count,
            duplicate_count=duplicate_count,
            quality_score=quality_score,
            record_results=record_results
        )

        validation_repository.save_results(val_doc)

        dataset_repository.update_status(
            dataset_id,
            DatasetStatus.VALIDATED.value,
            extra_fields={"updated_at": datetime.now(timezone.utc)}
        )

        return {
            "dataset_id": dataset_id,
            "total_records": total,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "warning_count": warning_count,
            "duplicate_count": duplicate_count,
            "quality_score": quality_score,
            "validated_at": val_doc["validated_at"]
        }

    @staticmethod
    def get_validation_results(dataset_id: str) -> dict:
        """Get validation details for a dataset."""
        res = validation_repository.get_by_dataset(dataset_id)
        if not res:
            raise NotFoundError("Validation result for dataset", dataset_id)
        return res


validation_service = ValidationService()
