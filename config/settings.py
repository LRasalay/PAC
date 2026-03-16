"""Application settings using Pydantic Settings."""

from __future__ import annotations


from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Policy-as-Code System"
    app_version: str = "0.1.0"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = Field(default=False, description="Enable debug mode")

    # API
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])

    # Database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./policy.db",
        description="Database connection URL",
    )
    database_echo: bool = Field(default=False, description="Echo SQL queries")

    # Policy Configuration
    policies_directory: str = Field(
        default="policies",
        description="Directory containing policy definitions",
    )
    policy_schema_path: str = Field(
        default="policies/schemas/policy_schema.json",
        description="Path to the master policy JSON Schema",
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log message format",
    )

    # Security
    api_key_header: str = "X-API-Key"
    require_api_key: bool = Field(default=False, description="Require API key for requests")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
