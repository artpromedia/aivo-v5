"""
AIVO Learning Backend - Main Application
Author: artpromedia
Date: 2025-11-23
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime

from core.config import settings
from core.logging import setup_logging
from core.exceptions import setup_exception_handlers
from db.database import init_db, close_db
from agents.agent_manager import agent_manager
from api.websockets import socket_manager, router as websocket_router
from api.routes import agents_router
from api.routes.websocket_metrics import router as websocket_metrics_router

# Setup logging
logger = setup_logging(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle
    """
    # Startup
    logger.info(f"Starting AIVO Learning Backend v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Developer: {settings.APP_AUTHOR}")
    logger.info(f"Startup Time: {datetime.utcnow().isoformat()}")
    
    try:
        # Initialize database
        try:
            await init_db()
            logger.info("✅ Database initialized")
        except Exception as db_error:
            logger.warning(f"⚠️ Database not available: {str(db_error)}")
            logger.warning("Running in limited mode without database")
        
        # Initialize WebSocket manager
        await socket_manager.initialize(agent_manager)
        logger.info("✅ WebSocket manager initialized")
        
        # Store managers in app state
        app.state.agent_manager = agent_manager
        app.state.socket_manager = socket_manager
        
        logger.info("🚀 AIVO Learning Backend started successfully!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AIVO Learning Backend...")
    
    try:
        # Cleanup WebSocket connections
        await socket_manager.disconnect_all()
        logger.info("✅ WebSocket connections closed")
        
        # Cleanup agent instances
        await agent_manager.cleanup_inactive_brains(inactive_minutes=0)
        logger.info("✅ Agent instances cleaned up")
        
        # Close database connections
        await close_db()
        logger.info("✅ Database connections closed")
        
        logger.info("👋 AIVO Learning Backend stopped gracefully")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}")


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url=f"{settings.API_PREFIX}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_PREFIX}/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json" if settings.DEBUG else None,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else ["aivolearning.com", "*.aivolearning.com"]
)


# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(f"📥 {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    # Log response
    logger.info(
        f"📤 {request.method} {request.url.path} "
        f"- Status: {response.status_code} "
        f"- Time: {process_time:.3f}s"
    )
    
    # Add custom headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = settings.APP_VERSION
    
    return response


# Setup exception handlers
setup_exception_handlers(app)


# Include API routers
app.include_router(
    agents_router,
    prefix=f"{settings.API_PREFIX}/agents",
    tags=["Agents"]
)
app.include_router(
    websocket_metrics_router,
    prefix=f"{settings.API_PREFIX}/websocket",
    tags=["WebSocket Metrics"]
)
app.include_router(websocket_router, tags=["WebSocket"])


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "virtual_brain": settings.ENABLE_VIRTUAL_BRAIN,
            "speech_analysis": settings.ENABLE_SPEECH_ANALYSIS,
            "content_adaptation": settings.ENABLE_CONTENT_ADAPTATION,
            "real_time_collaboration": settings.ENABLE_REAL_TIME_COLLABORATION,
        }
    }


# Ready check endpoint
@app.get("/ready", tags=["Health"])
async def ready_check():
    """Readiness check for Kubernetes"""
    checks = {
        "api": True,
        "status": "ready"
    }
    
    try:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "ready": True,
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
    except Exception as e:
        logger.error(f"Ready check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "ready": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AIVO Learning Backend API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_PREFIX}/docs" if settings.DEBUG else "Disabled in production",
        "health": "/health",
        "developer": settings.APP_AUTHOR,
        "date": "2025-11-23"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        workers=settings.WORKERS if not settings.RELOAD else 1,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG,
    )
