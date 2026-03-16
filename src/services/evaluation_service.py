"""Evaluation service for compliance checking."""

from __future__ import annotations


import hashlib
import json
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_logger
from src.core.engine.rule_engine import EvaluationResult, RuleEngine
from src.models.database import async_session_maker
from src.models.policy import EvaluationLog
from src.services.policy_service import PolicyService

logger = get_logger(__name__)


class EvaluationService:
    """Service for evaluating data against policies."""

    def __init__(self, session: AsyncSession | None = None) -> None:
        self._session = session
        self._engine = RuleEngine()
        self._policy_service = PolicyService(session)

    async def _get_session(self) -> AsyncSession:
        """Get or create a session."""
        if self._session:
            return self._session
        return async_session_maker()

    async def evaluate(
        self,
        policy_id: str,
        data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        store_input: bool = False,
    ) -> EvaluationResult:
        """Evaluate data against a policy."""
        # Get policy
        policy = await self._policy_service.get_policy(policy_id)
        if not policy:
            raise ValueError(f"Policy not found: {policy_id}")

        # Evaluate
        result = self._engine.evaluate_policy(policy, data, metadata)

        # Log evaluation
        await self._log_evaluation(
            policy_id=policy_id,
            policy_version=policy.get("version", "unknown"),
            data=data if store_input else None,
            result=result,
            metadata=metadata,
        )

        logger.info(
            f"Evaluated policy {policy_id}: compliant={result.compliant}, "
            f"passed={result.summary.get('passed', 0)}/{result.summary.get('total', 0)}"
        )

        return result

    async def _log_evaluation(
        self,
        policy_id: str,
        policy_version: str,
        data: dict[str, Any] | None,
        result: EvaluationResult,
        metadata: dict[str, Any] | None,
    ) -> None:
        """Log an evaluation to the database."""
        session = await self._get_session()
        async with session:
            # Compute input hash
            input_hash = hashlib.sha256(
                json.dumps(data or {}, sort_keys=True).encode()
            ).hexdigest()

            log = EvaluationLog(
                id=str(uuid.uuid4()),
                policy_id=policy_id,
                policy_version=policy_version,
                compliant=result.compliant,
                evaluated_at=result.evaluated_at,
                input_hash=input_hash,
                input_data=data,
                results=[
                    {
                        "rule_id": r.rule_id,
                        "rule_name": r.rule_name,
                        "status": r.status.value,
                        "message": r.message,
                    }
                    for r in result.results
                ],
                summary=result.summary,
                metadata_=metadata or {},
            )

            session.add(log)
            try:
                await session.commit()
            except Exception as e:
                logger.warning(f"Failed to log evaluation: {e}")
                await session.rollback()

    async def get_history(
        self,
        policy_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get evaluation history for a policy."""
        session = await self._get_session()
        async with session:
            # Count total
            count_stmt = select(func.count()).select_from(EvaluationLog).where(
                EvaluationLog.policy_id == policy_id
            )
            total_result = await session.execute(count_stmt)
            total = total_result.scalar() or 0

            # Get evaluations
            stmt = (
                select(EvaluationLog)
                .where(EvaluationLog.policy_id == policy_id)
                .order_by(EvaluationLog.evaluated_at.desc())
                .limit(limit)
                .offset(offset)
            )
            result = await session.execute(stmt)
            evaluations = [e.to_dict() for e in result.scalars().all()]

            return {
                "evaluations": evaluations,
                "total": total,
            }

    async def get_compliance_stats(
        self,
        policy_id: str | None = None,
    ) -> dict[str, Any]:
        """Get compliance statistics."""
        session = await self._get_session()
        async with session:
            stmt = select(
                func.count().label("total"),
                func.sum(EvaluationLog.compliant.cast(int)).label("compliant"),
            )
            if policy_id:
                stmt = stmt.where(EvaluationLog.policy_id == policy_id)

            result = await session.execute(stmt)
            row = result.one()

            total = row.total or 0
            compliant = row.compliant or 0

            return {
                "total_evaluations": total,
                "compliant": compliant,
                "non_compliant": total - compliant,
                "compliance_rate": (compliant / total * 100) if total > 0 else 0,
            }


async def get_evaluation_service() -> EvaluationService:
    """Dependency for getting evaluation service."""
    return EvaluationService()
