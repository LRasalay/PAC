"""Policy CRUD endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from src.services.policy_service import PolicyService, get_policy_service

router = APIRouter(prefix="/policies", tags=["policies"])


class PolicyCreate(BaseModel):
    """Request model for creating a policy."""
    id: str = Field(..., pattern=r"^[a-z0-9-]+$")
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+$")
    metadata: Dict[str, Any]
    rules: List[Dict[str, Any]]


class PolicyUpdate(BaseModel):
    """Request model for updating a policy."""
    version: Optional[str] = Field(None, pattern=r"^\d+\.\d+\.\d+$")
    metadata: Optional[Dict[str, Any]] = None
    rules: Optional[List[Dict[str, Any]]] = None


class PolicyResponse(BaseModel):
    """Response model for a policy."""
    id: str
    version: str
    metadata: Dict[str, Any]
    rules: List[Dict[str, Any]]


class PolicyListResponse(BaseModel):
    """Response model for listing policies."""
    policies: List[Dict[str, Any]]
    total: int


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy: PolicyCreate,
    service: PolicyService = Depends(get_policy_service),
) -> PolicyResponse:
    """Create a new policy."""
    try:
        created = await service.create_policy(policy.model_dump())
        return PolicyResponse(**created)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_policies(
    domain: Optional[str] = Query(None, description="Filter by domain (MRM, ERM, CRM)"),
    service: PolicyService = Depends(get_policy_service),
) -> PolicyListResponse:
    """List all policies with optional filtering."""
    policies = await service.list_policies(domain=domain)
    return PolicyListResponse(policies=policies, total=len(policies))


@router.get("/{policy_id}")
async def get_policy(
    policy_id: str,
    service: PolicyService = Depends(get_policy_service),
) -> PolicyResponse:
    """Get a specific policy by ID."""
    policy = await service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy not found: {policy_id}")
    return PolicyResponse(**policy)


@router.put("/{policy_id}")
async def update_policy(
    policy_id: str,
    policy_update: PolicyUpdate,
    service: PolicyService = Depends(get_policy_service),
) -> PolicyResponse:
    """Update an existing policy."""
    try:
        updated = await service.update_policy(
            policy_id,
            policy_update.model_dump(exclude_none=True),
        )
        if not updated:
            raise HTTPException(status_code=404, detail=f"Policy not found: {policy_id}")
        return PolicyResponse(**updated)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: str,
    service: PolicyService = Depends(get_policy_service),
) -> None:
    """Delete a policy."""
    deleted = await service.delete_policy(policy_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Policy not found: {policy_id}")
