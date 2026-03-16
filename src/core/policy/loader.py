"""Policy loading from files and directories."""

from __future__ import annotations


import json
from pathlib import Path
from typing import Any

from config import get_logger, get_settings
from src.core.policy.validator import PolicySemanticValidator, PolicyValidator

logger = get_logger(__name__)


class PolicyLoadError(Exception):
    """Exception raised when policy loading fails."""

    def __init__(self, message: str, policy_path: str | None = None, errors: list[str] | None = None):
        self.policy_path = policy_path
        self.errors = errors or []
        super().__init__(message)


class PolicyLoader:
    """Loader for policy definitions from files and directories."""

    def __init__(
        self,
        policies_directory: str | Path | None = None,
        validate: bool = True,
    ) -> None:
        """Initialize the policy loader.

        Args:
            policies_directory: Directory containing policy files
            validate: Whether to validate policies on load
        """
        settings = get_settings()
        self._policies_dir = Path(policies_directory or settings.policies_directory)
        self._validate = validate
        self._schema_validator = PolicyValidator() if validate else None
        self._semantic_validator = PolicySemanticValidator() if validate else None
        self._cache: dict[str, dict[str, Any]] = {}

    def load_policy(self, policy_path: str | Path) -> dict[str, Any]:
        """Load a single policy from a file.

        Args:
            policy_path: Path to the policy JSON file

        Returns:
            The policy definition

        Raises:
            PolicyLoadError: If loading or validation fails
        """
        path = Path(policy_path)
        cache_key = str(path.resolve())

        # Check cache
        if cache_key in self._cache:
            logger.debug(f"Using cached policy: {path}")
            return self._cache[cache_key]

        # Load file
        try:
            with open(path) as f:
                policy = json.load(f)
        except FileNotFoundError:
            raise PolicyLoadError(f"Policy file not found: {path}", str(path))
        except json.JSONDecodeError as e:
            raise PolicyLoadError(f"Invalid JSON in policy file: {e}", str(path))

        # Validate
        if self._validate:
            errors = self._validate_policy(policy)
            if errors:
                raise PolicyLoadError(
                    f"Policy validation failed: {path}",
                    str(path),
                    errors,
                )

        # Cache and return
        self._cache[cache_key] = policy
        logger.info(f"Loaded policy: {policy.get('id', 'unknown')} from {path}")
        return policy

    def load_policy_by_id(self, policy_id: str) -> dict[str, Any]:
        """Load a policy by its ID, searching in the policies directory.

        Args:
            policy_id: The policy ID to find

        Returns:
            The policy definition

        Raises:
            PolicyLoadError: If policy not found
        """
        # Search in domain subdirectories and root
        search_paths = [
            self._policies_dir / "mrm",
            self._policies_dir / "erm",
            self._policies_dir / "crm",
            self._policies_dir,
        ]

        for search_path in search_paths:
            if not search_path.exists():
                continue

            for policy_file in search_path.glob("*.json"):
                try:
                    policy = self.load_policy(policy_file)
                    if policy.get("id") == policy_id:
                        return policy
                except PolicyLoadError:
                    continue

        raise PolicyLoadError(f"Policy not found: {policy_id}")

    def load_all_policies(self, domain: str | None = None) -> list[dict[str, Any]]:
        """Load all policies from the policies directory.

        Args:
            domain: Optional domain filter (MRM, ERM, CRM)

        Returns:
            List of policy definitions
        """
        policies: list[dict[str, Any]] = []

        if domain:
            # Load from specific domain directory
            domain_dir = self._policies_dir / domain.lower()
            if domain_dir.exists():
                policies.extend(self._load_from_directory(domain_dir))
        else:
            # Load from all domain directories
            for domain_name in ["mrm", "erm", "crm"]:
                domain_dir = self._policies_dir / domain_name
                if domain_dir.exists():
                    policies.extend(self._load_from_directory(domain_dir))

            # Also load from root policies directory
            policies.extend(self._load_from_directory(self._policies_dir, recursive=False))

        return policies

    def _load_from_directory(
        self, directory: Path, recursive: bool = True
    ) -> list[dict[str, Any]]:
        """Load all policies from a directory.

        Args:
            directory: Directory to load from
            recursive: Whether to search recursively

        Returns:
            List of loaded policies
        """
        policies: list[dict[str, Any]] = []
        pattern = "**/*.json" if recursive else "*.json"

        for policy_file in directory.glob(pattern):
            # Skip schema files
            if "schema" in policy_file.name.lower():
                continue

            try:
                policy = self.load_policy(policy_file)
                policies.append(policy)
            except PolicyLoadError as e:
                logger.warning(f"Failed to load policy {policy_file}: {e}")
                continue

        return policies

    def _validate_policy(self, policy: dict[str, Any]) -> list[str]:
        """Validate a policy.

        Args:
            policy: The policy to validate

        Returns:
            List of validation errors
        """
        errors: list[str] = []

        if self._schema_validator:
            errors.extend(self._schema_validator.validate(policy))

        if self._semantic_validator:
            errors.extend(self._semantic_validator.validate(policy))

        return errors

    def reload_policy(self, policy_id: str) -> dict[str, Any]:
        """Reload a policy, clearing it from cache first.

        Args:
            policy_id: The policy ID to reload

        Returns:
            The reloaded policy
        """
        # Clear from cache
        self._cache = {
            k: v for k, v in self._cache.items() if v.get("id") != policy_id
        }

        return self.load_policy_by_id(policy_id)

    def clear_cache(self) -> None:
        """Clear the policy cache."""
        self._cache.clear()
        logger.info("Policy cache cleared")

    def get_policy_metadata(self, policy_id: str) -> dict[str, Any] | None:
        """Get just the metadata for a policy.

        Args:
            policy_id: The policy ID

        Returns:
            Policy metadata or None if not found
        """
        try:
            policy = self.load_policy_by_id(policy_id)
            return {
                "id": policy.get("id"),
                "version": policy.get("version"),
                **policy.get("metadata", {}),
            }
        except PolicyLoadError:
            return None

    def list_policy_ids(self, domain: str | None = None) -> list[str]:
        """List all available policy IDs.

        Args:
            domain: Optional domain filter

        Returns:
            List of policy IDs
        """
        policies = self.load_all_policies(domain)
        return [p.get("id") for p in policies if p.get("id")]
