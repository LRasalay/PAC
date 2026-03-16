"""Unit tests for the rule engine."""

import pytest

from src.core.engine.context import EvaluationContext
from src.core.engine.rule_engine import RuleEngine, RuleStatus


class TestEvaluationContext:
    def test_get_value_simple_path(self):
        ctx = EvaluationContext({"model": {"id": "test-123"}})
        assert ctx.get_value("$.model.id") == "test-123"

    def test_get_value_nested_path(self):
        ctx = EvaluationContext({
            "model": {
                "documentation": {
                    "url": "https://example.com"
                }
            }
        })
        assert ctx.get_value("$.model.documentation.url") == "https://example.com"

    def test_get_value_not_found(self):
        ctx = EvaluationContext({"model": {}})
        assert ctx.get_value("$.model.missing") is None

    def test_get_values_array(self):
        ctx = EvaluationContext({
            "items": [
                {"name": "a"},
                {"name": "b"},
                {"name": "c"}
            ]
        })
        values = ctx.get_values("$.items[*].name")
        assert values == ["a", "b", "c"]

    def test_has_path(self):
        ctx = EvaluationContext({"model": {"id": "test"}})
        assert ctx.has_path("$.model.id") is True
        assert ctx.has_path("$.model.missing") is False

    def test_variables(self):
        ctx = EvaluationContext({})
        ctx.set_variable("test_var", 42)
        assert ctx.get_variable("test_var") == 42
        assert ctx.get_variable("missing", "default") == "default"

    def test_rule_results(self):
        ctx = EvaluationContext({})
        ctx.record_rule_result("rule-1", True)
        ctx.record_rule_result("rule-2", False)

        assert ctx.get_rule_result("rule-1") is True
        assert ctx.get_rule_result("rule-2") is False
        assert ctx.get_rule_result("rule-3") is None

    def test_all_rules_passed(self):
        ctx = EvaluationContext({})
        ctx.record_rule_result("rule-1", True)
        ctx.record_rule_result("rule-2", True)
        ctx.record_rule_result("rule-3", False)

        assert ctx.all_rules_passed(["rule-1", "rule-2"]) is True
        assert ctx.all_rules_passed(["rule-1", "rule-3"]) is False

    def test_any_rule_passed(self):
        ctx = EvaluationContext({})
        ctx.record_rule_result("rule-1", True)
        ctx.record_rule_result("rule-2", False)

        assert ctx.any_rule_passed(["rule-1", "rule-2"]) is True
        assert ctx.any_rule_passed(["rule-2"]) is False


class TestRuleEngine:
    def test_evaluate_simple_exists_rule(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Field exists",
                    "conditions": {
                        "path": "$.field",
                        "operator": "exists",
                    }
                }
            ]
        }

        # Passing case
        result = engine.evaluate_policy(policy, {"field": "value"})
        assert result.compliant is True
        assert result.summary["passed"] == 1

        # Failing case
        result = engine.evaluate_policy(policy, {})
        assert result.compliant is False
        assert result.summary["failed"] == 1

    def test_evaluate_comparison_rule(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Value threshold",
                    "conditions": {
                        "path": "$.metrics.score",
                        "operator": "greater_than_or_equal",
                        "value": 0.8,
                    }
                }
            ]
        }

        # Passing case
        result = engine.evaluate_policy(policy, {"metrics": {"score": 0.9}})
        assert result.compliant is True

        # Failing case
        result = engine.evaluate_policy(policy, {"metrics": {"score": 0.5}})
        assert result.compliant is False

    def test_evaluate_all_conditions(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "All conditions",
                    "conditions": {
                        "all": [
                            {"path": "$.field1", "operator": "exists"},
                            {"path": "$.field2", "operator": "exists"},
                        ]
                    }
                }
            ]
        }

        # All conditions met
        result = engine.evaluate_policy(policy, {"field1": "a", "field2": "b"})
        assert result.compliant is True

        # One condition not met
        result = engine.evaluate_policy(policy, {"field1": "a"})
        assert result.compliant is False

    def test_evaluate_any_conditions(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Any condition",
                    "conditions": {
                        "any": [
                            {"path": "$.field1", "operator": "exists"},
                            {"path": "$.field2", "operator": "exists"},
                        ]
                    }
                }
            ]
        }

        # One condition met
        result = engine.evaluate_policy(policy, {"field1": "a"})
        assert result.compliant is True

        # No conditions met
        result = engine.evaluate_policy(policy, {})
        assert result.compliant is False

    def test_evaluate_not_condition(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Not condition",
                    "conditions": {
                        "not": {
                            "path": "$.deprecated",
                            "operator": "equals",
                            "value": True,
                        }
                    }
                }
            ]
        }

        # Not deprecated
        result = engine.evaluate_policy(policy, {"deprecated": False})
        assert result.compliant is True

        # Deprecated
        result = engine.evaluate_policy(policy, {"deprecated": True})
        assert result.compliant is False

    def test_evaluate_conditional_rule(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Conditional rule",
                    "when": {
                        "path": "$.type",
                        "operator": "equals",
                        "value": "premium",
                    },
                    "conditions": {
                        "path": "$.features.advanced",
                        "operator": "equals",
                        "value": True,
                    }
                }
            ]
        }

        # Condition applies and passes
        result = engine.evaluate_policy(
            policy, {"type": "premium", "features": {"advanced": True}}
        )
        assert result.compliant is True
        assert result.results[0].status == RuleStatus.PASS

        # Condition applies and fails
        result = engine.evaluate_policy(
            policy, {"type": "premium", "features": {"advanced": False}}
        )
        assert result.compliant is False
        assert result.results[0].status == RuleStatus.FAIL

        # Condition does not apply (skipped)
        result = engine.evaluate_policy(
            policy, {"type": "basic", "features": {"advanced": False}}
        )
        assert result.compliant is True
        assert result.results[0].status == RuleStatus.SKIP

    def test_evaluate_multiple_rules(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Rule 1",
                    "conditions": {"path": "$.field1", "operator": "exists"},
                },
                {
                    "id": "rule-2",
                    "name": "Rule 2",
                    "conditions": {"path": "$.field2", "operator": "exists"},
                },
                {
                    "id": "rule-3",
                    "name": "Rule 3",
                    "conditions": {"path": "$.field3", "operator": "exists"},
                },
            ]
        }

        result = engine.evaluate_policy(
            policy, {"field1": "a", "field2": "b"}
        )
        assert result.compliant is False
        assert result.summary["total"] == 3
        assert result.summary["passed"] == 2
        assert result.summary["failed"] == 1

    def test_validate_policy(self):
        engine = RuleEngine()

        # Valid policy
        valid_policy = {
            "id": "test",
            "rules": [
                {
                    "id": "rule-1",
                    "conditions": {"path": "$.field", "operator": "exists"},
                }
            ]
        }
        errors = engine.validate_policy(valid_policy)
        assert len(errors) == 0

        # Missing id
        invalid_policy = {"rules": []}
        errors = engine.validate_policy(invalid_policy)
        assert any("id" in e for e in errors)

        # Invalid operator
        invalid_op_policy = {
            "id": "test",
            "rules": [
                {
                    "id": "rule-1",
                    "conditions": {"path": "$.field", "operator": "invalid_op"},
                }
            ]
        }
        errors = engine.validate_policy(invalid_op_policy)
        assert any("invalid_op" in e for e in errors)

    def test_remediation_message(self):
        engine = RuleEngine()
        policy = {
            "id": "test-policy",
            "rules": [
                {
                    "id": "rule-1",
                    "name": "Required field",
                    "conditions": {"path": "$.required", "operator": "exists"},
                    "remediation": "Please provide the required field",
                }
            ]
        }

        result = engine.evaluate_policy(policy, {})
        assert result.results[0].message == "Please provide the required field"
