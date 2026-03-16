"""Policy validation using JSON Schema."""

from __future__ import annotations


import json
from pathlib import Path
from typing import Any

import jsonschema
from jsonschema import Draft202012Validator, ValidationError

from config import get_logger, get_settings

logger = get_logger(__name__)


class PolicyValidator:
    """Validator for policy definitions using JSON Schema."""

    def __init__(self, schema_path: str | Path | None = None) -> None:
        """Initialize the validator.

        Args:
            schema_path: Path to the JSON Schema file. Uses default from settings if not provided.
        """
        settings = get_settings()
        self._schema_path = Path(schema_path or settings.policy_schema_path)
        self._schema: dict[str, Any] | None = None
        self._validator: Draft202012Validator | None = None

    def _load_schema(self) -> dict[str, Any]:
        """Load the JSON Schema from file."""
        if self._schema is None:
            try:
                with open(self._schema_path) as f:
                    self._schema = json.load(f)
                logger.info(f"Loaded policy schema from {self._schema_path}")
            except FileNotFoundError:
                logger.warning(f"Schema file not found: {self._schema_path}, using minimal schema")
                self._schema = self._minimal_schema()
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in schema file: {e}")
                raise
        return self._schema

    def _minimal_schema(self) -> dict[str, Any]:
        """Return a minimal schema for basic validation."""
        return {
            "type": "object",
            "required": ["id", "rules"],
            "properties": {
                "id": {"type": "string"},
                "version": {"type": "string"},
                "rules": {"type": "array"},
            },
        }

    def _get_validator(self) -> Draft202012Validator:
        """Get or create the JSON Schema validator."""
        if self._validator is None:
            schema = self._load_schema()
            Draft202012Validator.check_schema(schema)
            self._validator = Draft202012Validator(schema)
        return self._validator

    def validate(self, policy: dict[str, Any]) -> list[str]:
        """Validate a policy against the schema.

        Args:
            policy: The policy definition to validate

        Returns:
            List of validation errors (empty if valid)
        """
        errors: list[str] = []
        validator = self._get_validator()

        for error in validator.iter_errors(policy):
            path = ".".join(str(p) for p in error.absolute_path)
            if path:
                errors.append(f"{path}: {error.message}")
            else:
                errors.append(error.message)

        return errors

    def is_valid(self, policy: dict[str, Any]) -> bool:
        """Check if a policy is valid.

        Args:
            policy: The policy definition to validate

        Returns:
            True if valid
        """
        validator = self._get_validator()
        return validator.is_valid(policy)

    def validate_or_raise(self, policy: dict[str, Any]) -> None:
        """Validate a policy and raise an exception if invalid.

        Args:
            policy: The policy definition to validate

        Raises:
            ValidationError: If policy is invalid
        """
        errors = self.validate(policy)
        if errors:
            raise ValidationError(f"Policy validation failed: {'; '.join(errors)}")


class PolicySemanticValidator:
    """Semantic validation for policies beyond schema validation."""

    def validate(self, policy: dict[str, Any]) -> list[str]:
        """Perform semantic validation on a policy.

        Args:
            policy: The policy definition

        Returns:
            List of semantic validation errors
        """
        errors: list[str] = []

        # Check for duplicate rule IDs
        rule_ids = [r.get("id") for r in policy.get("rules", [])]
        duplicates = [rid for rid in rule_ids if rule_ids.count(rid) > 1 and rid]
        if duplicates:
            errors.append(f"Duplicate rule IDs found: {set(duplicates)}")

        # Check effective date is not in the past (warning)
        metadata = policy.get("metadata", {})
        effective_date = metadata.get("effectiveDate")
        expiration_date = metadata.get("expirationDate")

        if effective_date and expiration_date:
            if effective_date > expiration_date:
                errors.append("effectiveDate must be before expirationDate")

        # Validate JSONPath expressions
        for i, rule in enumerate(policy.get("rules", [])):
            path_errors = self._validate_paths_in_conditions(
                rule.get("conditions", {}), f"rules[{i}].conditions"
            )
            errors.extend(path_errors)

        return errors

    def _validate_paths_in_conditions(
        self, conditions: Any, prefix: str
    ) -> list[str]:
        """Validate JSONPath expressions in conditions."""
        errors: list[str] = []

        if isinstance(conditions, list):
            for i, c in enumerate(conditions):
                errors.extend(self._validate_paths_in_conditions(c, f"{prefix}[{i}]"))
            return errors

        if not isinstance(conditions, dict):
            return errors

        # Check boolean operators
        for op in ["all", "any"]:
            if op in conditions:
                for i, c in enumerate(conditions[op]):
                    errors.extend(self._validate_paths_in_conditions(c, f"{prefix}.{op}[{i}]"))
                return errors

        if "not" in conditions:
            errors.extend(self._validate_paths_in_conditions(conditions["not"], f"{prefix}.not"))
            return errors

        # Validate path
        if "path" in conditions:
            path = conditions["path"]
            if not isinstance(path, str):
                errors.append(f"{prefix}.path: Must be a string")
            elif not path.startswith("$"):
                errors.append(f"{prefix}.path: JSONPath must start with '$'")

        return errors
