"""Evaluation endpoints for compliance checking."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.services.evaluation_service import EvaluationService, get_evaluation_service

router = APIRouter(prefix="/evaluate", tags=["evaluation"])


class EvaluationRequest(BaseModel):
    """Request model for policy evaluation."""
    policy_id: str = Field(..., description="ID of the policy to evaluate against")
    data: Dict[str, Any] = Field(..., description="Data to evaluate")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional evaluation metadata")


class RuleResultResponse(BaseModel):
    """Response model for a single rule result."""
    rule_id: str
    rule_name: str
    status: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class EvaluationResponse(BaseModel):
    """Response model for policy evaluation."""
    policy_id: str
    compliant: bool
    evaluated_at: datetime
    results: List[RuleResultResponse]
    summary: Dict[str, int]


class EvaluationHistoryItem(BaseModel):
    """Response model for evaluation history item."""
    id: str
    policy_id: str
    compliant: bool
    evaluated_at: datetime
    input_hash: str
    summary: Dict[str, int]


class EvaluationHistoryResponse(BaseModel):
    """Response model for evaluation history."""
    policy_id: str
    evaluations: List[EvaluationHistoryItem]
    total: int


@router.post("")
async def evaluate_policy(
    request: EvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationResponse:
    """Evaluate data against a policy."""
    try:
        result = await service.evaluate(
            policy_id=request.policy_id,
            data=request.data,
            metadata=request.metadata,
        )
        return EvaluationResponse(
            policy_id=result.policy_id,
            compliant=result.compliant,
            evaluated_at=result.evaluated_at,
            results=[
                RuleResultResponse(
                    rule_id=r.rule_id,
                    rule_name=r.rule_name,
                    status=r.status.value,
                    message=r.message,
                    details=r.details,
                )
                for r in result.results
            ],
            summary=result.summary,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/{policy_id}/history")
async def get_evaluation_history(
    policy_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationHistoryResponse:
    """Get evaluation history for a policy."""
    history = await service.get_history(policy_id, limit=limit, offset=offset)
    return EvaluationHistoryResponse(
        policy_id=policy_id,
        evaluations=[
            EvaluationHistoryItem(**item) for item in history["evaluations"]
        ],
        total=history["total"],
    )
