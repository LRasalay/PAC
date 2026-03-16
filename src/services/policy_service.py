"""Policy service for business logic."""

from __future__ import annotations


import hashlib
import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_logger
from src.core.policy.loader import PolicyLoader
from src.core.policy.validator import PolicySemanticValidator, PolicyValidator
from src.models.database import async_session_maker
from src.models.policy import Policy, PolicyVersion

logger = get_logger(__name__)


class PolicyService:
    """Service for managing policies."""

    def __init__(self, session: AsyncSession | None = None) -> None:
        self._session = session
        self._validator = PolicyValidator()
        self._semantic_validator = PolicySemanticValidator()
        self._loader = PolicyLoader(validate=False)

    async def _get_session(self) -> AsyncSession:
        """Get or create a session."""
        if self._session:
            return self._session
        return async_session_maker()

    async def create_policy(self, policy_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new policy."""
        # Validate
        errors = self._validator.validate(policy_data)
        errors.extend(self._semantic_validator.validate(policy_data))
        if errors:
            raise ValueError(f"Invalid policy: {'; '.join(errors)}")

        session = await self._get_session()
        async with session:
            # Check if exists
            existing = await session.get(Policy, policy_data["id"])
            if existing:
                raise ValueError(f"Policy already exists: {policy_data['id']}")

            metadata = policy_data.get("metadata", {})
            policy = Policy(
                id=policy_data["id"],
                version=policy_data.get("version", "1.0.0"),
                name=metadata.get("name", policy_data["id"]),
                description=metadata.get("description"),
                domain=metadata.get("domain", "MRM"),
                severity=metadata.get("severity", "medium"),
                owner=metadata.get("owner"),
                effective_date=self._parse_date(metadata.get("effectiveDate")),
                expiration_date=self._parse_date(metadata.get("expirationDate")),
                rules=policy_data.get("rules", []),
                metadata_=metadata,
            )

            session.add(policy)
            await session.commit()
            await session.refresh(policy)

            logger.info(f"Created policy: {policy.id}")
            return policy.to_dict()

    async def get_policy(self, policy_id: str) -> dict[str, Any] | None:
        """Get a policy by ID."""
        session = await self._get_session()
        async with session:
            policy = await session.get(Policy, policy_id)
            if policy and policy.is_active:
                return policy.to_dict()

            # Try loading from file
            try:
                return self._loader.load_policy_by_id(policy_id)
            except Exception:
                return None

    async def list_policies(
        self,
        domain: str | None = None,
        include_inactive: bool = False,
    ) -> list[dict[str, Any]]:
        """List all policies."""
        session = await self._get_session()
        async with session:
            stmt = select(Policy)
            if not include_inactive:
                stmt = stmt.where(Policy.is_active == True)
            if domain:
                stmt = stmt.where(Policy.domain == domain.upper())

            result = await session.execute(stmt)
            db_policies = [p.to_dict() for p in result.scalars().all()]

        # Also load from files
        try:
            file_policies = self._loader.load_all_policies(domain)
            db_ids = {p["id"] for p in db_policies}
            for fp in file_policies:
                if fp["id"] not in db_ids:
                    db_policies.append(fp)
        except Exception as e:
            logger.warning(f"Failed to load file policies: {e}")

        return db_policies

    async def update_policy(
        self,
        policy_id: str,
        update_data: dict[str, Any],
    ) -> dict[str, Any] | None:
        """Update an existing policy."""
        session = await self._get_session()
        async with session:
            policy = await session.get(Policy, policy_id)
            if not policy:
                return None

            # Create version snapshot
            version_record = PolicyVersion(
                policy_id=policy.id,
                version=policy.version,
                rules=policy.rules,
                metadata_=policy.metadata_,
                change_summary=f"Updated to version {update_data.get('version', policy.version)}",
            )
            session.add(version_record)

            # Update policy
            if "version" in update_data:
                policy.version = update_data["version"]
            if "rules" in update_data:
                policy.rules = update_data["rules"]
            if "metadata" in update_data:
                metadata = update_data["metadata"]
                if "name" in metadata:
                    policy.name = metadata["name"]
                if "description" in metadata:
                    policy.description = metadata["description"]
                if "domain" in metadata:
                    policy.domain = metadata["domain"]
                if "severity" in metadata:
                    policy.severity = metadata["severity"]
                if "owner" in metadata:
                    policy.owner = metadata["owner"]
                if "effectiveDate" in metadata:
                    policy.effective_date = self._parse_date(metadata["effectiveDate"])
                if "expirationDate" in metadata:
                    policy.expiration_date = self._parse_date(metadata["expirationDate"])
                policy.metadata_ = {**policy.metadata_, **metadata}

            await session.commit()
            await session.refresh(policy)

            logger.info(f"Updated policy: {policy.id}")
            return policy.to_dict()

    async def delete_policy(self, policy_id: str) -> bool:
        """Soft delete a policy."""
        session = await self._get_session()
        async with session:
            policy = await session.get(Policy, policy_id)
            if not policy:
                return False

            policy.is_active = False
            await session.commit()

            logger.info(f"Deleted policy: {policy_id}")
            return True

    def _parse_date(self, date_str: str | None) -> datetime | None:
        """Parse a date string."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            return None


async def get_policy_service() -> PolicyService:
    """Dependency for getting policy service."""
    return PolicyService()
