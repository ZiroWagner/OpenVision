from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "OpenVision"
    app_version: str = "0.1.0"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://openvision:openvision@localhost:5432/openvision"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    storage_path: str = "/app/storage"
    max_upload_size_mb: int = 10

    cors_origins: list[str] = ["*"]

    camera_check_interval: int = 30
    event_retention_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
