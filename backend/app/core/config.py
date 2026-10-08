from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "DataTripwire Backend"
    app_env: str = "development"
    app_version: str = "0.2.0"
    host: str = "0.0.0.0"
    port: int = 8000
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"
    database_url: str = "sqlite+aiosqlite:///./datatripwire.db"
    jwt_secret: str = "change-this-development-secret"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    seed_demo_data: bool = True
    ai_service_url: str = "http://localhost:8001"
    ai_timeout_seconds: float = 5.0
    verify_threshold: int = 50
    restrict_threshold: int = 70
    block_threshold: int = 85
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

    @field_validator("api_v1_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        return (value if value.startswith("/") else "/" + value).rstrip("/")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

@lru_cache
def get_settings() -> Settings:
    return Settings()
