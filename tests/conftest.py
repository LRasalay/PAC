"""Pytest configuration and fixtures."""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.main import app
from src.models.database import Base, get_session


# Test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def sample_policy() -> dict:
    """Sample policy for testing."""
    return {
        "id": "test-policy",
        "version": "1.0.0",
        "metadata": {
            "name": "Test Policy",
            "domain": "MRM",
            "severity": "high",
        },
        "rules": [
            {
                "id": "rule-001",
                "name": "Test field exists",
                "conditions": {
                    "path": "$.data.field",
                    "operator": "exists",
                },
            },
            {
                "id": "rule-002",
                "name": "Test value check",
                "conditions": {
                    "path": "$.data.value",
                    "operator": "greater_than",
                    "value": 10,
                },
            },
        ],
    }


@pytest.fixture
def sample_data_passing() -> dict:
    """Sample data that passes the test policy."""
    return {
        "data": {
            "field": "exists",
            "value": 15,
        }
    }


@pytest.fixture
def sample_data_failing() -> dict:
    """Sample data that fails the test policy."""
    return {
        "data": {
            "value": 5,
        }
    }
