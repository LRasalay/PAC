"""Logging configuration for the application."""

from __future__ import annotations


import logging
import sys
from typing import Any

from config.settings import get_settings


def setup_logging() -> None:
    """Configure application logging."""
    settings = get_settings()

    # Create formatter
    formatter = logging.Formatter(settings.log_format)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper()))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Set third-party loggers to WARNING
    for logger_name in ["uvicorn.access", "sqlalchemy.engine"]:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    # Enable SQL echo if configured
    if settings.database_echo:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)


# Logging configuration dictionary for uvicorn
def get_uvicorn_log_config() -> dict[str, Any]:
    """Get logging configuration for uvicorn."""
    settings = get_settings()
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": settings.log_format,
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": settings.log_level},
            "uvicorn.error": {"level": settings.log_level},
            "uvicorn.access": {"handlers": ["default"], "level": "WARNING"},
        },
    }
