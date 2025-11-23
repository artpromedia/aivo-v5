"""
AIVO Learning Backend Configuration
Author: artpromedia
Date: 2025-11-23
"""

from typing import List, Union, Optional, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator, Field
import secrets
import os
from datetime import timedelta

class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application Info
    APP_NAME: str = "AIVO Learning Backend"
    APP_VERSION: str = "5.0.0"
    APP_DESCRIPTION: str = "AI-powered personalized learning platform backend"
    APP_AUTHOR: str = "artpromedia"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    TESTING: bool = Field(default=False, env="TESTING")
    
    # API Configuration
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "AIVO Learning API"
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    WORKERS: int = Field(default=4, env="WORKERS")
    RELOAD: bool = Field(default=False, env="RELOAD")
    
    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    BCRYPT_ROUNDS: int = 12
    
    # Database
    DATABASE_URL: str = Field(default="postgresql+asyncpg://aivo:aivo123@localhost:5432/aivo_learning", env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    DATABASE_POOL_PRE_PING: bool = True
    DATABASE_ECHO: bool = False
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_PASSWORD: Optional[str] = None
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_DECODE_RESPONSES: bool = True
    
    # AI Services
    OPENAI_API_KEY: str = Field(default="sk-test-key", env="OPENAI_API_KEY")
    OPENAI_ORG_ID: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"
    
    # Speech Services
    GOOGLE_SPEECH_API_KEY: Optional[str] = None
    AZURE_SPEECH_KEY: Optional[str] = None
    AZURE_SPEECH_REGION: str = "eastus"
    
    # Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "aivo-learning-assets"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Email
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@aivolearning.com"
    SUPPORT_EMAIL: str = "support@aivolearning.com"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://aivolearning.com"
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Celery
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2")
    CELERY_TASK_ALWAYS_EAGER: bool = False
    CELERY_TASK_EAGER_PROPAGATES: bool = False
    
    # Feature Flags
    ENABLE_VIRTUAL_BRAIN: bool = True
    ENABLE_SPEECH_ANALYSIS: bool = True
    ENABLE_CONTENT_ADAPTATION: bool = True
    ENABLE_REAL_TIME_COLLABORATION: bool = True
    ENABLE_ADVANCED_ANALYTICS: bool = True
    
    # Virtual Brain Settings
    VIRTUAL_BRAIN_MAX_MEMORY: int = 1000  # Maximum memory entries
    VIRTUAL_BRAIN_CONTEXT_WINDOW: int = 4000  # Token context window
    VIRTUAL_BRAIN_TEMPERATURE: float = 0.7
    VIRTUAL_BRAIN_MAX_RETRIES: int = 3
    
    # Learning Settings
    SESSION_TIMEOUT_MINUTES: int = 45
    BREAK_REMINDER_MINUTES: int = 30
    MAX_CONSECUTIVE_ERRORS: int = 3
    ADAPTATION_THRESHOLD: float = 0.7
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @property
    def database_url_async(self) -> str:
        """Convert DATABASE_URL to async version"""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    @property
    def redis_settings(self) -> Dict[str, Any]:
        """Get Redis connection settings"""
        return {
            "url": self.REDIS_URL,
            "password": self.REDIS_PASSWORD,
            "max_connections": self.REDIS_MAX_CONNECTIONS,
            "decode_responses": self.REDIS_DECODE_RESPONSES,
        }
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()

# Log configuration on startup
if settings.DEBUG:
    print(f"""
    🚀 AIVO Learning Backend Configuration
    =====================================
    Environment: {settings.ENVIRONMENT}
    Debug: {settings.DEBUG}
    API Prefix: {settings.API_PREFIX}
    Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}
    Redis: {settings.REDIS_URL}
    AI Model: {settings.OPENAI_MODEL}
    Virtual Brain: {'Enabled' if settings.ENABLE_VIRTUAL_BRAIN else 'Disabled'}
    Author: {settings.APP_AUTHOR}
    Date: 2025-11-23
    =====================================
    """)
