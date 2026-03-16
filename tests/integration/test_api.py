"""Integration tests for the API."""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    """Test client fixture."""
    with TestClient(app) as c:
        yield c


class TestHealthEndpoints:
    def test_root_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_api_health(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_readiness(self, client):
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"

    def test_liveness(self, client):
        response = client.get("/api/v1/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestPolicyEndpoints:
    def test_list_policies(self, client):
        response = client.get("/api/v1/policies")
        assert response.status_code == 200
        data = response.json()
        assert "policies" in data
        assert "total" in data

    def test_list_policies_with_domain_filter(self, client):
        response = client.get("/api/v1/policies?domain=MRM")
        assert response.status_code == 200
        data = response.json()
        assert "policies" in data
        # All returned policies should be MRM domain
        for policy in data["policies"]:
            if "metadata" in policy:
                assert policy["metadata"].get("domain") == "MRM"

    def test_get_policy_not_found(self, client):
        response = client.get("/api/v1/policies/nonexistent-policy")
        assert response.status_code == 404

    def test_create_and_get_policy(self, client):
        policy = {
            "id": "test-api-policy",
            "version": "1.0.0",
            "metadata": {
                "name": "Test API Policy",
                "domain": "MRM",
                "severity": "medium",
            },
            "rules": [
                {
                    "id": "rule-001",
                    "name": "Test Rule",
                    "conditions": {
                        "path": "$.field",
                        "operator": "exists",
                    },
                }
            ],
        }

        # Create
        response = client.post("/api/v1/policies", json=policy)
        assert response.status_code == 201
        created = response.json()
        assert created["id"] == "test-api-policy"

        # Get
        response = client.get("/api/v1/policies/test-api-policy")
        assert response.status_code == 200
        fetched = response.json()
        assert fetched["id"] == "test-api-policy"

        # Cleanup - delete
        response = client.delete("/api/v1/policies/test-api-policy")
        assert response.status_code == 204


class TestEvaluationEndpoints:
    def test_evaluate_policy(self, client):
        # First ensure we have a policy to evaluate against
        policy = {
            "id": "eval-test-policy",
            "version": "1.0.0",
            "metadata": {
                "name": "Evaluation Test Policy",
                "domain": "MRM",
            },
            "rules": [
                {
                    "id": "rule-001",
                    "name": "Field exists",
                    "conditions": {
                        "path": "$.model.id",
                        "operator": "exists",
                    },
                },
            ],
        }
        client.post("/api/v1/policies", json=policy)

        # Evaluate - passing case
        eval_request = {
            "policy_id": "eval-test-policy",
            "data": {"model": {"id": "test-model"}},
        }
        response = client.post("/api/v1/evaluate", json=eval_request)
        assert response.status_code == 200
        result = response.json()
        assert result["compliant"] is True
        assert result["summary"]["passed"] == 1

        # Evaluate - failing case
        eval_request = {
            "policy_id": "eval-test-policy",
            "data": {"model": {}},
        }
        response = client.post("/api/v1/evaluate", json=eval_request)
        assert response.status_code == 200
        result = response.json()
        assert result["compliant"] is False

        # Cleanup
        client.delete("/api/v1/policies/eval-test-policy")

    def test_evaluate_nonexistent_policy(self, client):
        eval_request = {
            "policy_id": "nonexistent-policy-xyz",
            "data": {},
        }
        response = client.post("/api/v1/evaluate", json=eval_request)
        assert response.status_code == 404


class TestBulkEvaluationEndpoints:
    def test_bulk_evaluate(self, client):
        # Create test policy
        policy = {
            "id": "bulk-test-policy",
            "version": "1.0.0",
            "metadata": {"name": "Bulk Test", "domain": "MRM"},
            "rules": [
                {
                    "id": "rule-001",
                    "name": "Value check",
                    "conditions": {
                        "path": "$.value",
                        "operator": "greater_than",
                        "value": 50,
                    },
                },
            ],
        }
        client.post("/api/v1/policies", json=policy)

        # Bulk evaluate
        bulk_request = {
            "items": [
                {"id": "item-1", "policy_id": "bulk-test-policy", "data": {"value": 100}},
                {"id": "item-2", "policy_id": "bulk-test-policy", "data": {"value": 25}},
                {"id": "item-3", "policy_id": "bulk-test-policy", "data": {"value": 75}},
            ],
        }
        response = client.post("/api/v1/evaluate/bulk", json=bulk_request)
        assert response.status_code == 200
        result = response.json()
        assert result["total"] == 3
        assert result["compliant"] == 2
        assert result["non_compliant"] == 1

        # Cleanup
        client.delete("/api/v1/policies/bulk-test-policy")

    def test_multi_policy_evaluate(self, client):
        # Create test policies
        for i in range(2):
            policy = {
                "id": f"multi-policy-{i}",
                "version": "1.0.0",
                "metadata": {"name": f"Multi Policy {i}", "domain": "MRM"},
                "rules": [
                    {
                        "id": "rule-001",
                        "name": "Field exists",
                        "conditions": {
                            "path": f"$.field{i}",
                            "operator": "exists",
                        },
                    },
                ],
            }
            client.post("/api/v1/policies", json=policy)

        # Multi-policy evaluate
        request = {
            "policy_ids": ["multi-policy-0", "multi-policy-1"],
            "data": {"field0": "value0", "field1": "value1"},
        }
        response = client.post("/api/v1/evaluate/bulk/multi-policy", json=request)
        assert response.status_code == 200
        result = response.json()
        assert result["all_compliant"] is True
        assert len(result["results"]) == 2

        # Cleanup
        for i in range(2):
            client.delete(f"/api/v1/policies/multi-policy-{i}")
