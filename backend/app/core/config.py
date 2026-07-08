"""Application configuration"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8001
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/startupforge"

    # API Keys
    OPENAI_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    BROWSERLESS_API_KEY: str = ""

    # Vector Store
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""

    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]

    # JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Extra Configuration Variables
    FRONTEND_URL: str = "http://localhost:3000"
    VITE_API_URL: str = "http://127.0.0.1:8001"
    LOG_LEVEL: str = "INFO"

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
        "case_sensitive": True
    }


settings = Settings()

# Clean dummy placeholder keys to ensure checks like 'if settings.OPENAI_API_KEY' evaluate to False
for attr in ["OPENAI_API_KEY", "SERPER_API_KEY", "QDRANT_API_KEY"]:
    val = getattr(settings, attr, "")
    if val:
        val_clean = val.strip()
        if (
            "your-" in val_clean.lower()
            or "placeholder" in val_clean.lower()
            or val_clean.lower() == "test"
            or len(val_clean) < 10
        ):
            setattr(settings, attr, "")



def is_openai_available() -> bool:
    """Check if OpenAI API key is configured with a valid non-placeholder key"""
    key = settings.OPENAI_API_KEY
    if not key:
        return False
    key_lower = key.strip()
    if "your-" in key_lower or "placeholder" in key_lower or key_lower == "test" or len(key_lower) < 10:
        return False
    return True

