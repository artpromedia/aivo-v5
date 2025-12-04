"""
Database Configuration and Session Management
Author: artpromedia
Date: 2025-11-23
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import text
from typing import AsyncGenerator

from core.config import settings
from core.logging import setup_logging

logger = setup_logging(__name__)

# Create async engine
engine = create_async_engine(
    settings.database_url_async,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database sessions
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {str(e)}")
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def close_db():
    """
    Close database connections
    """
    await engine.dispose()
    logger.info("Database connections closed")


async def get_db_status() -> dict:
    """
    Get database connection status for health checks
    """
    try:
        async with AsyncSessionLocal() as session:
            # Execute simple query to verify connection
            await session.execute(text("SELECT 1"))
            return {
                "connected": True,
                "pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else None,
            }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "connected": False,
            "error": str(e),
        }
