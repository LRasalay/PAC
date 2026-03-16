"""Unit tests for operators."""

from datetime import datetime, timedelta

import pytest

from src.core.engine.operators import (
    BetweenOperator,
    ContainsOperator,
    DateAfterOperator,
    DateBeforeOperator,
    DateWithinOperator,
    EndsWithOperator,
    EqualsOperator,
    ExistsOperator,
    GreaterThanOperator,
    GreaterThanOrEqualOperator,
    InOperator,
    IsTypeOperator,
    LengthGreaterThanOperator,
    LengthLessThanOperator,
    LengthOperator,
    LessThanOperator,
    LessThanOrEqualOperator,
    MatchesOperator,
    NotEqualsOperator,
    NotInOperator,
    OperatorRegistry,
    StartsWithOperator,
    get_operator_registry,
)


class TestExistsOperator:
    def test_exists_with_value(self):
        op = ExistsOperator()
        assert op.evaluate("value", True) is True
        assert op.evaluate(123, True) is True
        assert op.evaluate([], True) is True

    def test_exists_with_none(self):
        op = ExistsOperator()
        assert op.evaluate(None, True) is False

    def test_not_exists(self):
        op = ExistsOperator()
        assert op.evaluate(None, False) is True
        assert op.evaluate("value", False) is False


class TestEqualsOperator:
    def test_equals_strings(self):
        op = EqualsOperator()
        assert op.evaluate("hello", "hello") is True
        assert op.evaluate("hello", "world") is False

    def test_equals_numbers(self):
        op = EqualsOperator()
        assert op.evaluate(42, 42) is True
        assert op.evaluate(42, 43) is False

    def test_equals_none(self):
        op = EqualsOperator()
        assert op.evaluate(None, None) is True


class TestNotEqualsOperator:
    def test_not_equals(self):
        op = NotEqualsOperator()
        assert op.evaluate("hello", "world") is True
        assert op.evaluate("hello", "hello") is False


class TestComparisonOperators:
    def test_greater_than(self):
        op = GreaterThanOperator()
        assert op.evaluate(10, 5) is True
        assert op.evaluate(5, 10) is False
        assert op.evaluate(5, 5) is False
        assert op.evaluate(None, 5) is False

    def test_greater_than_or_equal(self):
        op = GreaterThanOrEqualOperator()
        assert op.evaluate(10, 5) is True
        assert op.evaluate(5, 5) is True
        assert op.evaluate(4, 5) is False

    def test_less_than(self):
        op = LessThanOperator()
        assert op.evaluate(5, 10) is True
        assert op.evaluate(10, 5) is False
        assert op.evaluate(5, 5) is False

    def test_less_than_or_equal(self):
        op = LessThanOrEqualOperator()
        assert op.evaluate(5, 10) is True
        assert op.evaluate(5, 5) is True
        assert op.evaluate(6, 5) is False


class TestInOperator:
    def test_in_list(self):
        op = InOperator()
        assert op.evaluate("a", ["a", "b", "c"]) is True
        assert op.evaluate("d", ["a", "b", "c"]) is False

    def test_in_invalid_operand(self):
        op = InOperator()
        assert op.evaluate("a", "abc") is False


class TestNotInOperator:
    def test_not_in_list(self):
        op = NotInOperator()
        assert op.evaluate("d", ["a", "b", "c"]) is True
        assert op.evaluate("a", ["a", "b", "c"]) is False


class TestMatchesOperator:
    def test_matches_regex(self):
        op = MatchesOperator()
        assert op.evaluate("hello123", r"hello\d+") is True
        assert op.evaluate("hello", r"hello\d+") is False

    def test_matches_with_none(self):
        op = MatchesOperator()
        assert op.evaluate(None, r".*") is False

    def test_invalid_regex(self):
        op = MatchesOperator()
        assert op.evaluate("test", r"[invalid") is False


class TestContainsOperator:
    def test_contains_string(self):
        op = ContainsOperator()
        assert op.evaluate("hello world", "world") is True
        assert op.evaluate("hello", "world") is False

    def test_contains_list(self):
        op = ContainsOperator()
        assert op.evaluate([1, 2, 3], 2) is True
        assert op.evaluate([1, 2, 3], 4) is False


class TestStartsWithOperator:
    def test_starts_with(self):
        op = StartsWithOperator()
        assert op.evaluate("hello world", "hello") is True
        assert op.evaluate("hello world", "world") is False


class TestEndsWithOperator:
    def test_ends_with(self):
        op = EndsWithOperator()
        assert op.evaluate("hello world", "world") is True
        assert op.evaluate("hello world", "hello") is False


class TestDateOperators:
    def test_date_before(self):
        op = DateBeforeOperator()
        assert op.evaluate("2024-01-01", "2024-06-01") is True
        assert op.evaluate("2024-06-01", "2024-01-01") is False

    def test_date_after(self):
        op = DateAfterOperator()
        assert op.evaluate("2024-06-01", "2024-01-01") is True
        assert op.evaluate("2024-01-01", "2024-06-01") is False

    def test_date_within_days(self):
        op = DateWithinOperator()
        recent_date = (datetime.now() - timedelta(days=10)).isoformat()
        old_date = (datetime.now() - timedelta(days=100)).isoformat()

        assert op.evaluate(recent_date, "30d") is True
        assert op.evaluate(old_date, "30d") is False


class TestBetweenOperator:
    def test_between(self):
        op = BetweenOperator()
        assert op.evaluate(5, [1, 10]) is True
        assert op.evaluate(1, [1, 10]) is True
        assert op.evaluate(10, [1, 10]) is True
        assert op.evaluate(15, [1, 10]) is False


class TestLengthOperators:
    def test_length(self):
        op = LengthOperator()
        assert op.evaluate("hello", 5) is True
        assert op.evaluate([1, 2, 3], 3) is True

    def test_length_greater_than(self):
        op = LengthGreaterThanOperator()
        assert op.evaluate("hello", 3) is True
        assert op.evaluate("hi", 3) is False

    def test_length_less_than(self):
        op = LengthLessThanOperator()
        assert op.evaluate("hi", 5) is True
        assert op.evaluate("hello world", 5) is False


class TestIsTypeOperator:
    def test_is_type(self):
        op = IsTypeOperator()
        assert op.evaluate("hello", "string") is True
        assert op.evaluate(123, "number") is True
        assert op.evaluate(123, "integer") is True
        assert op.evaluate(1.5, "float") is True
        assert op.evaluate(True, "boolean") is True
        assert op.evaluate([1, 2], "array") is True
        assert op.evaluate({"a": 1}, "object") is True
        assert op.evaluate(None, "null") is True


class TestOperatorRegistry:
    def test_get_operator_registry(self):
        registry = get_operator_registry()
        assert registry.has("exists")
        assert registry.has("equals")
        assert registry.has("greater_than")
        assert registry.has("in")
        assert registry.has("matches")

    def test_list_operators(self):
        registry = get_operator_registry()
        operators = registry.list_operators()
        assert len(operators) > 15
        assert "exists" in operators
        assert "date_within" in operators

    def test_register_custom(self):
        registry = OperatorRegistry()

        def custom_op(value, operand, context):
            return value == operand * 2

        registry.register_custom("double_of", custom_op)
        assert registry.has("double_of")

        op = registry.get("double_of")
        assert op.evaluate(10, 5) is True
        assert op.evaluate(10, 4) is False
