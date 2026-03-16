"""Built-in operators for the rule engine."""

from __future__ import annotations


import re
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Callable

from dateutil.parser import parse as parse_date
from dateutil.relativedelta import relativedelta


class Operator(ABC):
    """Base class for all operators."""

    name: str

    @abstractmethod
    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        """Evaluate the operator."""
        pass


class ExistsOperator(Operator):
    """Check if a value exists (is not None)."""

    name = "exists"

    def evaluate(self, value: Any, operand: Any = True, context: dict[str, Any] | None = None) -> bool:
        exists = value is not None
        # Default to checking existence if operand is None or True
        if operand is None or operand is True:
            return exists
        return not exists


class EqualsOperator(Operator):
    """Check if value equals operand."""

    name = "equals"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        return value == operand


class NotEqualsOperator(Operator):
    """Check if value does not equal operand."""

    name = "not_equals"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        return value != operand


class GreaterThanOperator(Operator):
    """Check if value is greater than operand."""

    name = "greater_than"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        return value > operand


class GreaterThanOrEqualOperator(Operator):
    """Check if value is greater than or equal to operand."""

    name = "greater_than_or_equal"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        return value >= operand


class LessThanOperator(Operator):
    """Check if value is less than operand."""

    name = "less_than"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        return value < operand


class LessThanOrEqualOperator(Operator):
    """Check if value is less than or equal to operand."""

    name = "less_than_or_equal"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        return value <= operand


class InOperator(Operator):
    """Check if value is in a list of values."""

    name = "in"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if not isinstance(operand, (list, tuple, set)):
            return False
        return value in operand


class NotInOperator(Operator):
    """Check if value is not in a list of values."""

    name = "not_in"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if not isinstance(operand, (list, tuple, set)):
            return True
        return value not in operand


class MatchesOperator(Operator):
    """Check if value matches a regular expression."""

    name = "matches"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None or not isinstance(value, str):
            return False
        try:
            return bool(re.match(operand, value))
        except re.error:
            return False


class ContainsOperator(Operator):
    """Check if value contains operand (for strings or lists)."""

    name = "contains"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return operand in value
        if isinstance(value, (list, tuple, set)):
            return operand in value
        return False


class StartsWithOperator(Operator):
    """Check if string value starts with operand."""

    name = "starts_with"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if not isinstance(value, str) or not isinstance(operand, str):
            return False
        return value.startswith(operand)


class EndsWithOperator(Operator):
    """Check if string value ends with operand."""

    name = "ends_with"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if not isinstance(value, str) or not isinstance(operand, str):
            return False
        return value.endswith(operand)


class DateBeforeOperator(Operator):
    """Check if date value is before operand date."""

    name = "date_before"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        try:
            value_date = parse_date(str(value)) if not isinstance(value, datetime) else value
            operand_date = parse_date(str(operand)) if not isinstance(operand, datetime) else operand
            return value_date < operand_date
        except (ValueError, TypeError):
            return False


class DateAfterOperator(Operator):
    """Check if date value is after operand date."""

    name = "date_after"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        try:
            value_date = parse_date(str(value)) if not isinstance(value, datetime) else value
            operand_date = parse_date(str(operand)) if not isinstance(operand, datetime) else operand
            return value_date > operand_date
        except (ValueError, TypeError):
            return False


class DateWithinOperator(Operator):
    """Check if date value is within a duration from now.

    Operand format: "30d" (days), "6m" (months), "1y" (years)
    """

    name = "date_within"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        try:
            value_date = parse_date(str(value)) if not isinstance(value, datetime) else value
            now = datetime.now()

            # Parse duration string
            duration = self._parse_duration(operand)
            if duration is None:
                return False

            cutoff_date = now - duration
            return value_date >= cutoff_date
        except (ValueError, TypeError):
            return False

    def _parse_duration(self, duration_str: str) -> timedelta | relativedelta | None:
        """Parse duration string like '30d', '6m', '1y'."""
        if not isinstance(duration_str, str):
            return None

        match = re.match(r"^(\d+)([dDmMyY])$", duration_str)
        if not match:
            return None

        amount = int(match.group(1))
        unit = match.group(2).lower()

        if unit == "d":
            return timedelta(days=amount)
        elif unit == "m":
            return relativedelta(months=amount)
        elif unit == "y":
            return relativedelta(years=amount)
        return None


class BetweenOperator(Operator):
    """Check if value is between two values (inclusive)."""

    name = "between"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        if not isinstance(operand, (list, tuple)) or len(operand) != 2:
            return False
        return operand[0] <= value <= operand[1]


class LengthOperator(Operator):
    """Check if length of value equals operand."""

    name = "length"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        try:
            return len(value) == operand
        except TypeError:
            return False


class LengthGreaterThanOperator(Operator):
    """Check if length of value is greater than operand."""

    name = "length_greater_than"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        try:
            return len(value) > operand
        except TypeError:
            return False


class LengthLessThanOperator(Operator):
    """Check if length of value is less than operand."""

    name = "length_less_than"

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        if value is None:
            return False
        try:
            return len(value) < operand
        except TypeError:
            return False


class IsTypeOperator(Operator):
    """Check if value is of specified type."""

    name = "is_type"

    TYPE_MAP = {
        "string": str,
        "number": (int, float),
        "integer": int,
        "float": float,
        "boolean": bool,
        "array": list,
        "object": dict,
        "null": type(None),
    }

    def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
        expected_type = self.TYPE_MAP.get(operand)
        if expected_type is None:
            return False
        return isinstance(value, expected_type)


class OperatorRegistry:
    """Registry for operators."""

    def __init__(self) -> None:
        self._operators: dict[str, Operator] = {}

    def register(self, operator: Operator) -> None:
        """Register an operator."""
        self._operators[operator.name] = operator

    def get(self, name: str) -> Operator | None:
        """Get an operator by name."""
        return self._operators.get(name)

    def has(self, name: str) -> bool:
        """Check if operator exists."""
        return name in self._operators

    def list_operators(self) -> list[str]:
        """List all registered operator names."""
        return list(self._operators.keys())

    def register_custom(self, name: str, func: Callable[[Any, Any, dict[str, Any] | None], bool]) -> None:
        """Register a custom operator from a function."""
        class CustomOperator(Operator):
            def __init__(self, op_name: str, op_func: Callable):
                self.name = op_name
                self._func = op_func

            def evaluate(self, value: Any, operand: Any, context: dict[str, Any] | None = None) -> bool:
                return self._func(value, operand, context)

        self._operators[name] = CustomOperator(name, func)


@lru_cache
def get_operator_registry() -> OperatorRegistry:
    """Get the default operator registry with all built-in operators."""
    registry = OperatorRegistry()

    # Register all built-in operators
    operators = [
        ExistsOperator(),
        EqualsOperator(),
        NotEqualsOperator(),
        GreaterThanOperator(),
        GreaterThanOrEqualOperator(),
        LessThanOperator(),
        LessThanOrEqualOperator(),
        InOperator(),
        NotInOperator(),
        MatchesOperator(),
        ContainsOperator(),
        StartsWithOperator(),
        EndsWithOperator(),
        DateBeforeOperator(),
        DateAfterOperator(),
        DateWithinOperator(),
        BetweenOperator(),
        LengthOperator(),
        LengthGreaterThanOperator(),
        LengthLessThanOperator(),
        IsTypeOperator(),
    ]

    for op in operators:
        registry.register(op)

    return registry
