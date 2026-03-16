"""Policy database models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.database import Base


class Policy(Base):
    """Policy model storing policy definitions."""

    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    domain: Mapped[str] = mapped_column(String(10), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    owner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rules: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    metadata_: Mapped[Dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    versions: Mapped[List["PolicyVersion"]] = relationship(
        "PolicyVersion", back_populates="policy", cascade="all, delete-orphan"
    )
    evaluations: Mapped[List["EvaluationLog"]] = relationship(
        "EvaluationLog", back_populates="policy", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_policies_domain", "domain"),
        Index("ix_policies_is_active", "is_active"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "version": self.version,
            "metadata": {
                "name": self.name,
                "description": self.description,
                "domain": self.domain,
                "severity": self.severity,
                "owner": self.owner,
                "effectiveDate": self.effective_date.isoformat() if self.effective_date else None,
                "expirationDate": self.expiration_date.isoformat() if self.expiration_date else None,
                **self.metadata_,
            },
            "rules": self.rules,
        }


class PolicyVersion(Base):
    """Policy version history."""

    __tablename__ = "policy_versions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    policy_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    rules: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    metadata_: Mapped[Dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    policy: Mapped["Policy"] = relationship("Policy", back_populates="versions")

    __table_args__ = (
        Index("ix_policy_versions_policy_id", "policy_id"),
        Index("ix_policy_versions_version", "version"),
    )


class EvaluationLog(Base):
    """Audit log for policy evaluations."""

    __tablename__ = "evaluation_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    policy_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False
    )
    policy_version: Mapped[str] = mapped_column(String(20), nullable=False)
    compliant: Mapped[bool] = mapped_column(nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    input_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    results: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    summary: Mapped[Dict[str, int]] = mapped_column(JSON, nullable=False)
    metadata_: Mapped[Dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    client_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Relationships
    policy: Mapped["Policy"] = relationship("Policy", back_populates="evaluations")

    __table_args__ = (
        Index("ix_evaluation_logs_policy_id", "policy_id"),
        Index("ix_evaluation_logs_evaluated_at", "evaluated_at"),
        Index("ix_evaluation_logs_compliant", "compliant"),
        Index("ix_evaluation_logs_input_hash", "input_hash"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "compliant": self.compliant,
            "evaluated_at": self.evaluated_at.isoformat(),
            "input_hash": self.input_hash,
            "summary": self.summary,
        }
