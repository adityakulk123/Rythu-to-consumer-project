import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "RythuDirect"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "rythudirect_super_secret_jwt_key_2026_farm_fair_pricing"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: Supports Neon PostgreSQL or SQLite for seamless fallback
    DATABASE_URL: str = "sqlite:///./rythudirect.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]
    
    # Payment Provider: "mock", "razorpay", "stripe"
    PAYMENT_GATEWAY_PROVIDER: str = "mock"
    PAYMENT_KEY_ID: str = "mock_key_id"
    PAYMENT_KEY_SECRET: str = "mock_key_secret"
    
    # Object Storage (Cloudinary compatible)
    CLOUDINARY_CLOUD_NAME: str = "mock_cloud"
    CLOUDINARY_API_KEY: str = "mock_key"
    CLOUDINARY_API_SECRET: str = "mock_secret"
    
    # SMS / Email configuration
    NOTIFICATION_PROVIDER: str = "mock_sms_email"
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
