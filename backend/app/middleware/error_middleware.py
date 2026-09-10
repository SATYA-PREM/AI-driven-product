from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
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
                "details": exc.details or {}
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception")
        request_id = request_id_var.get(None)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "details": {"request_id": request_id}
            }
        )
