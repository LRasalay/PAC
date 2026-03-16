"""API v1 router combining all endpoints."""

from fastapi import APIRouter

from src.api.v1.endpoints import bulk, evaluation, health, policies

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router)
api_router.include_router(policies.router)
api_router.include_router(evaluation.router)
api_router.include_router(bulk.router)
