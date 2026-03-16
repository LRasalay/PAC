"""Core rule evaluation engine."""

from __future__ import annotations


from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from config import get_logger
from src.core.engine.context import EvaluationContext
from src.core.engine.operators import OperatorRegistry, get_operator_registry

logger = get_logger(__name__)


class RuleStatus(str, Enum):
    """Status of a rule evaluation."""
    PASS = "pass"
    FAIL = "fail"
    ERROR = "error"
    SKIP = "skip"


@dataclass
class RuleResult:
    """Result of evaluating a single rule."""
    rule_id: str
    rule_name: str
    status: RuleStatus
    message: str
    details: dict[str, Any] = field(default_factory=dict)


@dataclass
class EvaluationResult:
    """Result of evaluating a policy against data."""
    policy_id: str
    compliant: bool
    evaluated_at: datetime
    results: list[RuleResult]
    summary: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "policy_id": self.policy_id,
            "compliant": self.compliant,
            "evaluated_at": self.evaluated_at.isoformat(),
            "results": [
                {
                    "rule_id": r.rule_id,
                    "rule_name": r.rule_name,
                    "status": r.status.value,
                    "message": r.message,
                    "details": r.details,
                }
                for r in self.results
            ],
            "summary": self.summary,
        }


class RuleEngine:
    """Engine for evaluating rules against data."""

    def __init__(self, operator_registry: OperatorRegistry | None = None) -> None:
        """Initialize the rule engine.

        Args:
            operator_registry: Custom operator registry, uses default if not provided
        """
        self._operators = operator_registry or get_operator_registry()

    def evaluate_policy(
        self,
        policy: dict[str, Any],
        data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> EvaluationResult:
        """Evaluate a policy against data.

        Args:
            policy: The policy definition
            data: The data to evaluate
            metadata: Optional metadata for evaluation context

        Returns:
            EvaluationResult with all rule results
        """
        context = EvaluationContext(data, metadata)
        policy_id = policy.get("id", "unknown")
        rules = policy.get("rules", [])

        results: list[RuleResult] = []

        for rule in rules:
            result = self._evaluate_rule(rule, context)
            results.append(result)
            context.record_rule_result(result.rule_id, result.status == RuleStatus.PASS)

        # Calculate summary
        summary = {
            "total": len(results),
            "passed": sum(1 for r in results if r.status == RuleStatus.PASS),
            "failed": sum(1 for r in results if r.status == RuleStatus.FAIL),
            "errors": sum(1 for r in results if r.status == RuleStatus.ERROR),
            "skipped": sum(1 for r in results if r.status == RuleStatus.SKIP),
        }

        # Policy is compliant if no failures or errors
        compliant = summary["failed"] == 0 and summary["errors"] == 0

        return EvaluationResult(
            policy_id=policy_id,
            compliant=compliant,
            evaluated_at=context.evaluation_time,
            results=results,
            summary=summary,
        )

    def _evaluate_rule(self, rule: dict[str, Any], context: EvaluationContext) -> RuleResult:
        """Evaluate a single rule.

        Args:
            rule: The rule definition
            context: The evaluation context

        Returns:
            RuleResult for this rule
        """
        rule_id = rule.get("id", "unknown")
        rule_name = rule.get("name", "Unnamed Rule")

        try:
            # Check if rule should be skipped based on preconditions
            if "when" in rule:
                if not self._evaluate_conditions(rule["when"], context):
                    return RuleResult(
                        rule_id=rule_id,
                        rule_name=rule_name,
                        status=RuleStatus.SKIP,
                        message="Rule precondition not met",
                    )

            # Evaluate rule conditions
            conditions = rule.get("conditions", {})
            passed = self._evaluate_conditions(conditions, context)

            if passed:
                return RuleResult(
                    rule_id=rule_id,
                    rule_name=rule_name,
                    status=RuleStatus.PASS,
                    message="All conditions satisfied",
                )
            else:
                return RuleResult(
                    rule_id=rule_id,
                    rule_name=rule_name,
                    status=RuleStatus.FAIL,
                    message=rule.get("remediation", "Rule conditions not met"),
                    details={"conditions": conditions},
                )

        except Exception as e:
            logger.exception(f"Error evaluating rule {rule_id}: {e}")
            return RuleResult(
                rule_id=rule_id,
                rule_name=rule_name,
                status=RuleStatus.ERROR,
                message=f"Error during evaluation: {str(e)}",
            )

    def _evaluate_conditions(
        self,
        conditions: dict[str, Any] | list[dict[str, Any]],
        context: EvaluationContext,
    ) -> bool:
        """Evaluate condition(s) recursively.

        Supports:
        - all: All conditions must pass
        - any: Any condition must pass
        - not: Negates the condition
        - Single condition with path/operator/value

        Args:
            conditions: Condition definition
            context: Evaluation context

        Returns:
            True if conditions are met
        """
        if isinstance(conditions, list):
            # Treat list as "all"
            return all(self._evaluate_conditions(c, context) for c in conditions)

        if not isinstance(conditions, dict):
            return False

        # Boolean operators
        if "all" in conditions:
            return all(self._evaluate_conditions(c, context) for c in conditions["all"])

        if "any" in conditions:
            return any(self._evaluate_conditions(c, context) for c in conditions["any"])

        if "not" in conditions:
            return not self._evaluate_conditions(conditions["not"], context)

        # Single condition with path and operator
        if "path" in conditions and "operator" in conditions:
            return self._evaluate_single_condition(conditions, context)

        # Path exists check (shorthand)
        if "path" in conditions and "operator" not in conditions:
            return context.has_path(conditions["path"])

        return False

    def _evaluate_single_condition(
        self,
        condition: dict[str, Any],
        context: EvaluationContext,
    ) -> bool:
        """Evaluate a single condition.

        Args:
            condition: Condition with path, operator, and optional value
            context: Evaluation context

        Returns:
            True if condition is satisfied
        """
        path = condition["path"]
        operator_name = condition["operator"]
        operand = condition.get("value")

        # Get value from context
        value = context.get_value(path)

        # Get operator
        operator = self._operators.get(operator_name)
        if operator is None:
            logger.warning(f"Unknown operator: {operator_name}")
            return False

        # Evaluate
        try:
            return operator.evaluate(value, operand, context.to_dict())
        except Exception as e:
            logger.error(f"Operator evaluation failed: {e}")
            return False

    def validate_policy(self, policy: dict[str, Any]) -> list[str]:
        """Validate policy structure and operators.

        Args:
            policy: The policy to validate

        Returns:
            List of validation errors (empty if valid)
        """
        errors: list[str] = []

        if "id" not in policy:
            errors.append("Policy must have an 'id' field")

        if "rules" not in policy:
            errors.append("Policy must have a 'rules' field")
        elif not isinstance(policy["rules"], list):
            errors.append("'rules' must be a list")
        else:
            for i, rule in enumerate(policy["rules"]):
                rule_errors = self._validate_rule(rule, i)
                errors.extend(rule_errors)

        return errors

    def _validate_rule(self, rule: dict[str, Any], index: int) -> list[str]:
        """Validate a single rule.

        Args:
            rule: The rule to validate
            index: Rule index for error messages

        Returns:
            List of validation errors
        """
        errors: list[str] = []
        prefix = f"Rule[{index}]"

        if "id" not in rule:
            errors.append(f"{prefix}: Rule must have an 'id' field")

        if "conditions" not in rule:
            errors.append(f"{prefix}: Rule must have a 'conditions' field")
        else:
            condition_errors = self._validate_conditions(rule["conditions"], f"{prefix}.conditions")
            errors.extend(condition_errors)

        return errors

    def _validate_conditions(self, conditions: Any, prefix: str) -> list[str]:
        """Validate conditions recursively.

        Args:
            conditions: The conditions to validate
            prefix: Path prefix for error messages

        Returns:
            List of validation errors
        """
        errors: list[str] = []

        if isinstance(conditions, list):
            for i, c in enumerate(conditions):
                errors.extend(self._validate_conditions(c, f"{prefix}[{i}]"))
            return errors

        if not isinstance(conditions, dict):
            errors.append(f"{prefix}: Condition must be a dict or list")
            return errors

        # Check boolean operators
        for op in ["all", "any"]:
            if op in conditions:
                if not isinstance(conditions[op], list):
                    errors.append(f"{prefix}.{op}: Must be a list")
                else:
                    for i, c in enumerate(conditions[op]):
                        errors.extend(self._validate_conditions(c, f"{prefix}.{op}[{i}]"))
                return errors

        if "not" in conditions:
            errors.extend(self._validate_conditions(conditions["not"], f"{prefix}.not"))
            return errors

        # Single condition validation
        if "path" in conditions:
            if "operator" in conditions:
                op_name = conditions["operator"]
                if not self._operators.has(op_name):
                    errors.append(f"{prefix}: Unknown operator '{op_name}'")

        return errors
