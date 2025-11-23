"""
Custom exceptions and error handlers for AIVO Learning Backend
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Union, Dict, Any
import traceback
from datetime import datetime


class AIVOException(Exception):
    """Base exception for AIVO Learning"""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Dict[str, Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(AIVOException):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication failed", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(AIVOException):
    """Insufficient permissions"""
    def __init__(self, message: str = "Insufficient permissions", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class NotFoundError(AIVOException):
    """Resource not found"""
    def __init__(self, message: str = "Resource not found", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ValidationError(AIVOException):
    """Validation error"""
    def __init__(self, message: str = "Validation error", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class RateLimitError(AIVOException):
    """Rate limit exceeded"""
    def __init__(self, message: str = "Rate limit exceeded", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


class DatabaseError(AIVOException):
    """Database operation failed"""
    def __init__(self, message: str = "Database error", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)


class ExternalServiceError(AIVOException):
    """External service error (AI, Storage, etc.)"""
    def __init__(self, message: str = "External service error", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, details)


class AgentError(AIVOException):
    """AI Agent error"""
    def __init__(self, message: str = "Agent error", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)


def create_error_response(
    message: str,
    status_code: int,
    details: Dict[str, Any] = None,
    request: Request = None
) -> JSONResponse:
    """Create standardized error response"""
    from core.config import settings
    
    error_response = {
        "error": {
            "message": message,
            "code": status_code,
            "timestamp": datetime.utcnow().isoformat(),
        }
    }
    
    # Add details if provided
    if details:
        error_response["error"]["details"] = details
    
    # Add request info in debug mode
    if settings.DEBUG and request:
        error_response["error"]["request"] = {
            "method": request.method,
            "url": str(request.url),
            "client": request.client.host if request.client else None,
        }
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup all exception handlers for the application"""
    from core.logging import logger
    
    @app.exception_handler(AIVOException)
    async def aivo_exception_handler(request: Request, exc: AIVOException):
        """Handle custom AIVO exceptions"""
        logger.error(
            f"AIVO Exception: {exc.message}",
            status_code=exc.status_code,
            details=exc.details,
            path=request.url.path,
        )
        return create_error_response(
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details,
            request=request
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions"""
        logger.warning(
            f"HTTP Exception: {exc.detail}",
            status_code=exc.status_code,
            path=request.url.path,
        )
        return create_error_response(
            message=exc.detail,
            status_code=exc.status_code,
            request=request
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors"""
        logger.warning(
            "Validation error",
            errors=exc.errors(),
            path=request.url.path,
        )
        return create_error_response(
            message="Validation error",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"validation_errors": exc.errors()},
            request=request
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        from core.config import settings
        
        # Log the full traceback
        logger.error(
            f"Unhandled exception: {str(exc)}",
            exc_info=True,
            path=request.url.path,
            traceback=traceback.format_exc(),
        )
        
        # Don't expose internal errors in production
        message = str(exc) if settings.DEBUG else "Internal server error"
        
        return create_error_response(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"type": type(exc).__name__} if settings.DEBUG else None,
            request=request
        )
