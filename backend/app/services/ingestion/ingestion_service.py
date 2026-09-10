from __future__ import annotations
from datetime import datetime, timezone

from app.repositories.dataset_repository import dataset_repository
from app.repositories.processing_job_repository import processing_job_repository
from app.repositories.data_repository import data_repository
from app.models.dataset import DatasetModel
from app.models.processing_job import ProcessingJobModel
from app.core.constants import DatasetStatus, JobStatus, JobStep, FileFormat, SourceType
from app.core.exceptions import FileProcessingError
from app.services.ingestion.file_validator import file_validator
from app.services.ingestion.format_detector import format_detector
from app.services.ingestion.file_parser import get_parser, register_parser
from app.services.ingestion.csv_parser import csv_parser
from app.services.ingestion.json_parser import json_parser
from app.services.ingestion.excel_parser import excel_parser
from app.utils.serialization import serialize_document

# Register parsers to the registry
register_parser(FileFormat.CSV, csv_parser)
register_parser(FileFormat.JSON, json_parser)
register_parser(FileFormat.XLSX, excel_parser)


class IngestionService:
    """Service for orchestrating the file ingestion flow."""

    @staticmethod
    def ingest_file(
        workspace_id: str,
        product_id: str,
        source_type: str,
        filename: str,
        file_bytes: bytes,
        uploaded_by: str
    ) -> dict:
        """Process an uploaded file and create records in the database."""
        file_size = len(file_bytes)

        is_valid, errors = file_validator.validate_file(filename, file_size, file_bytes)
        if not is_valid:
            raise FileProcessingError(f"File validation failed: {', '.join(errors)}")

        file_format = format_detector.detect_format(filename, file_bytes)

        # Create Dataset document
        dataset_doc = DatasetModel.create_document(
            workspace_id=workspace_id,
            product_id=product_id,
            filename=filename,
            format=file_format,
            source_type=SourceType(source_type) if source_type in [s.value for s in SourceType] else SourceType.FEEDBACK,
            file_size=file_size,
            uploaded_by=uploaded_by,
            status=DatasetStatus.INGESTING
        )
        dataset_id = dataset_repository.create(dataset_doc)

        # Create ProcessingJob document
        job_doc = ProcessingJobModel.create_document(
            dataset_id=str(dataset_id),
            workspace_id=workspace_id,
            current_step=JobStep.INGESTION,
            status=JobStatus.RUNNING,
            progress=10.0
        )
        job_id = processing_job_repository.create(job_doc)

        try:
            parser = get_parser(file_format)
            records = parser.parse(file_bytes)

            if records:
                # Format raw records for storage
                raw_docs = []
                for idx, r in enumerate(records, start=1):
                    raw_docs.append({
                        "dataset_id": str(dataset_id),
                        "workspace_id": workspace_id,
                        "product_id": product_id,
                        "source_type": source_type,
                        "source_record_id": str(r.get("customer_id") or r.get("review_id") or r.get("ticket_id") or f"row_{idx}"),
                        "row_number": idx,
                        "original_record": r,
                        "created_at": datetime.now(timezone.utc)
                    })
                data_repository.insert_raw_records(raw_docs)

            # Update dataset status
            dataset_repository.update_status(
                str(dataset_id),
                DatasetStatus.INGESTED.value,
                extra_fields={"record_count": len(records), "updated_at": datetime.now(timezone.utc)}
            )

            # Update job status
            processing_job_repository.update_step(
                job_id=str(job_id),
                step=JobStep.INGESTION.value,
                status=JobStatus.COMPLETED.value,
                progress=20.0,
                step_result={"records_ingested": len(records)}
            )

        except Exception as e:
            dataset_repository.update_status(str(dataset_id), DatasetStatus.FAILED.value)
            processing_job_repository.mark_failed(str(job_id), str(e))
            raise FileProcessingError(f"Ingestion failed: {str(e)}")

        return {
            "dataset_id": str(dataset_id),
            "job_id": str(job_id),
            "filename": filename,
            "format": file_format.value,
            "message": f"Successfully ingested {len(records)} records."
        }


ingestion_service = IngestionService()
