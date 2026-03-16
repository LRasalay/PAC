"""Evaluation context for cross-field rules and state management."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from jsonpath_ng import parse as parse_jsonpath
from jsonpath_ng.exceptions import JsonPathParserError


class EvaluationContext:
    """Context for rule evaluation, providing access to data and state."""

    def __init__(self, data: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> None:
        """Initialize evaluation context.

        Args:
            data: The data being evaluated
            metadata: Optional metadata about the evaluation
        """
        self._data = data
        self._metadata = metadata or {}
        self._evaluated_rules: dict[str, bool] = {}
        self._evaluation_time = datetime.utcnow()
        self._variables: dict[str, Any] = {}

    @property
    def data(self) -> dict[str, Any]:
        """Get the evaluation data."""
        return self._data

    @property
    def metadata(self) -> dict[str, Any]:
        """Get the evaluation metadata."""
        return self._metadata

    @property
    def evaluation_time(self) -> datetime:
        """Get the evaluation timestamp."""
        return self._evaluation_time

    def get_value(self, path: str) -> Any:
        """Get a value from data using JSONPath.

        Args:
            path: JSONPath expression (e.g., "$.model.id")

        Returns:
            The value at the path, or None if not found
        """
        try:
            jsonpath_expr = parse_jsonpath(path)
            matches = jsonpath_expr.find(self._data)
            if not matches:
                return None
            # Return single value if one match, list if multiple
            if len(matches) == 1:
                return matches[0].value
            return [m.value for m in matches]
        except JsonPathParserError:
            return None

    def get_values(self, path: str) -> list[Any]:
        """Get all values matching a JSONPath expression.

        Args:
            path: JSONPath expression

        Returns:
            List of matching values
        """
        try:
            jsonpath_expr = parse_jsonpath(path)
            matches = jsonpath_expr.find(self._data)
            return [m.value for m in matches]
        except JsonPathParserError:
            return []

    def has_path(self, path: str) -> bool:
        """Check if a path exists in the data.

        Args:
            path: JSONPath expression

        Returns:
            True if path exists
        """
        try:
            jsonpath_expr = parse_jsonpath(path)
            matches = jsonpath_expr.find(self._data)
            return len(matches) > 0
        except JsonPathParserError:
            return False

    def set_variable(self, name: str, value: Any) -> None:
        """Set a context variable for use in other rules.

        Args:
            name: Variable name
            value: Variable value
        """
        self._variables[name] = value

    def get_variable(self, name: str, default: Any = None) -> Any:
        """Get a context variable.

        Args:
            name: Variable name
            default: Default value if not found

        Returns:
            Variable value or default
        """
        return self._variables.get(name, default)

    def record_rule_result(self, rule_id: str, passed: bool) -> None:
        """Record the result of a rule evaluation.

        Args:
            rule_id: The rule identifier
            passed: Whether the rule passed
        """
        self._evaluated_rules[rule_id] = passed

    def get_rule_result(self, rule_id: str) -> Optional[bool]:
        """Get the result of a previously evaluated rule.

        Args:
            rule_id: The rule identifier

        Returns:
            True if passed, False if failed, None if not evaluated
        """
        return self._evaluated_rules.get(rule_id)

    def all_rules_passed(self, rule_ids: list[str]) -> bool:
        """Check if all specified rules passed.

        Args:
            rule_ids: List of rule identifiers

        Returns:
            True if all rules passed
        """
        for rule_id in rule_ids:
            result = self._evaluated_rules.get(rule_id)
            if result is None or not result:
                return False
        return True

    def any_rule_passed(self, rule_ids: list[str]) -> bool:
        """Check if any specified rule passed.

        Args:
            rule_ids: List of rule identifiers

        Returns:
            True if any rule passed
        """
        for rule_id in rule_ids:
            result = self._evaluated_rules.get(rule_id)
            if result is True:
                return True
        return False

    def to_dict(self) -> dict[str, Any]:
        """Convert context to dictionary for serialization."""
        return {
            "data": self._data,
            "metadata": self._metadata,
            "evaluation_time": self._evaluation_time.isoformat(),
            "evaluated_rules": self._evaluated_rules,
            "variables": self._variables,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "EvaluationContext":
        """Create context from dictionary."""
        ctx = cls(
            data=data.get("data", {}),
            metadata=data.get("metadata"),
        )
        ctx._evaluated_rules = data.get("evaluated_rules", {})
        ctx._variables = data.get("variables", {})
        if "evaluation_time" in data:
            ctx._evaluation_time = datetime.fromisoformat(data["evaluation_time"])
        return ctx
