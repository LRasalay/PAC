"""Bulk evaluation endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.services.evaluation_service import EvaluationService, get_evaluation_service

router = APIRouter(prefix="/evaluate/bulk", tags=["bulk"])


class BulkEvaluationItem(BaseModel):
    """Single item in a bulk evaluation request."""
    id: str = Field(..., description="Unique identifier for this item")
    policy_id: str = Field(..., description="Policy to evaluate against")
    data: Dict[str, Any] = Field(..., description="Data to evaluate")


class BulkEvaluationRequest(BaseModel):
    """Request model for bulk evaluation."""
    items: List[BulkEvaluationItem] = Field(..., min_length=1, max_length=100)
    fail_fast: bool = Field(False, description="Stop on first failure")


class BulkEvaluationResultItem(BaseModel):
    """Result for a single bulk evaluation item."""
    id: str
    policy_id: str
    compliant: bool
    evaluated_at: datetime
    summary: Dict[str, int]
    error: Optional[str] = None


class BulkEvaluationResponse(BaseModel):
    """Response model for bulk evaluation."""
    total: int
    compliant: int
    non_compliant: int
    errors: int
    results: List[BulkEvaluationResultItem]


@router.post("")
async def bulk_evaluate(
    request: BulkEvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service),
) -> BulkEvaluationResponse:
    """Evaluate multiple items against their respective policies."""
    results: List[BulkEvaluationResultItem] = []
    compliant_count = 0
    non_compliant_count = 0
    error_count = 0

    for item in request.items:
        try:
            result = await service.evaluate(
                policy_id=item.policy_id,
                data=item.data,
            )

            result_item = BulkEvaluationResultItem(
                id=item.id,
                policy_id=item.policy_id,
                compliant=result.compliant,
                evaluated_at=result.evaluated_at,
                summary=result.summary,
            )
            results.append(result_item)

            if result.compliant:
                compliant_count += 1
            else:
                non_compliant_count += 1
                if request.fail_fast:
                    break

        except Exception as e:
            error_count += 1
            results.append(
                BulkEvaluationResultItem(
                    id=item.id,
                    policy_id=item.policy_id,
                    compliant=False,
                    evaluated_at=datetime.utcnow(),
                    summary={},
                    error=str(e),
                )
            )
            if request.fail_fast:
                break

    return BulkEvaluationResponse(
        total=len(results),
        compliant=compliant_count,
        non_compliant=non_compliant_count,
        errors=error_count,
        results=results,
    )


class MultiPolicyEvaluationRequest(BaseModel):
    """Request to evaluate data against multiple policies."""
    policy_ids: List[str] = Field(..., min_length=1, description="Policies to evaluate against")
    data: Dict[str, Any] = Field(..., description="Data to evaluate")


class MultiPolicyResultItem(BaseModel):
    """Result for a single policy in multi-policy evaluation."""
    policy_id: str
    compliant: bool
    summary: Dict[str, int]
    error: Optional[str] = None


class MultiPolicyEvaluationResponse(BaseModel):
    """Response for multi-policy evaluation."""
    all_compliant: bool
    evaluated_at: datetime
    results: List[MultiPolicyResultItem]


@router.post("/multi-policy")
async def evaluate_multi_policy(
    request: MultiPolicyEvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service),
) -> MultiPolicyEvaluationResponse:
    """Evaluate data against multiple policies."""
    results: List[MultiPolicyResultItem] = []
    all_compliant = True

    for policy_id in request.policy_ids:
        try:
            result = await service.evaluate(
                policy_id=policy_id,
                data=request.data,
            )
            results.append(
                MultiPolicyResultItem(
                    policy_id=policy_id,
                    compliant=result.compliant,
                    summary=result.summary,
                )
            )
            if not result.compliant:
                all_compliant = False
        except Exception as e:
            results.append(
                MultiPolicyResultItem(
                    policy_id=policy_id,
                    compliant=False,
                    summary={},
                    error=str(e),
                )
            )
            all_compliant = False

    return MultiPolicyEvaluationResponse(
        all_compliant=all_compliant,
        evaluated_at=datetime.utcnow(),
        results=results,
    )
