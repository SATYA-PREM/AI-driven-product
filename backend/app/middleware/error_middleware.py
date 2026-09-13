from fastapi import Request, FastAPI
from fastapi.exceptions import ResponseValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from app.core.exceptions import AppException
from app.core.logging import request_id_var
import logging

logger = logging.getLogger(__name__)


def add_error_middleware(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "details": exc.details or {},
            },
        )

    @app.exception_handler(ServerSelectionTimeoutError)
    @app.exception_handler(PyMongoError)
    async def mongo_exception_handler(request: Request, exc: PyMongoError) -> JSONResponse:
        logger.error(f"MongoDB connection/operation error: {exc}")
        request_id = request_id_var.get(None)
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Database service is temporarily unavailable. Please verify internet connectivity or MongoDB Atlas status.",
                "details": {
                    "error_type": exc.__class__.__name__,
                    "error": str(exc),
                    "request_id": request_id,
                },
            },
        )

    @app.exception_handler(ResponseValidationError)
    async def response_validation_exception_handler(request: Request, exc: ResponseValidationError) -> JSONResponse:
        logger.error(f"Response validation error: {exc.errors()}")
        request_id = request_id_var.get(None)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Response validation error occurred during output serialization.",
                "details": {
                    "errors": [str(err) for err in exc.errors()],
                    "request_id": request_id,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"Unhandled exception: {exc}")
        request_id = request_id_var.get(None)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "details": {
                    "error": str(exc),
                    "request_id": request_id,
                },
            },
        )
