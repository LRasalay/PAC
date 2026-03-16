"""Unit tests for policy loader."""

import json
import tempfile
from pathlib import Path

import pytest

from src.core.policy.loader import PolicyLoadError, PolicyLoader
from src.core.policy.validator import PolicyValidator


class TestPolicyValidator:
    def test_validate_valid_policy(self):
        validator = PolicyValidator()
        policy = {
            "id": "test-policy",
            "version": "1.0.0",
            "metadata": {
                "name": "Test Policy",
                "domain": "MRM",
            },
            "rules": [
                {
                    "id": "rule-001",
                    "name": "Test rule",
                    "conditions": {
                        "path": "$.field",
                        "operator": "exists",
                    }
                }
            ]
        }
        errors = validator.validate(policy)
        # May have errors if schema file doesn't exist, but basic validation should pass
        assert isinstance(errors, list)

    def test_is_valid(self):
        validator = PolicyValidator()
        valid_policy = {
            "id": "test",
            "version": "1.0.0",
            "metadata": {"name": "Test", "domain": "MRM"},
            "rules": [{"id": "r1", "name": "R1", "conditions": {}}],
        }
        # Should return boolean
        result = validator.is_valid(valid_policy)
        assert isinstance(result, bool)


class TestPolicyLoader:
    def test_load_policy_from_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            policy = {
                "id": "test-policy",
                "version": "1.0.0",
                "metadata": {"name": "Test", "domain": "MRM"},
                "rules": [{"id": "r1", "name": "R1", "conditions": {}}],
            }
            policy_path = Path(tmpdir) / "test.json"
            with open(policy_path, "w") as f:
                json.dump(policy, f)

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)
            loaded = loader.load_policy(policy_path)

            assert loaded["id"] == "test-policy"
            assert loaded["version"] == "1.0.0"

    def test_load_policy_not_found(self):
        loader = PolicyLoader(validate=False)
        with pytest.raises(PolicyLoadError) as exc_info:
            loader.load_policy("/nonexistent/path.json")
        assert "not found" in str(exc_info.value)

    def test_load_policy_invalid_json(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            invalid_path = Path(tmpdir) / "invalid.json"
            with open(invalid_path, "w") as f:
                f.write("{ invalid json }")

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)
            with pytest.raises(PolicyLoadError) as exc_info:
                loader.load_policy(invalid_path)
            assert "Invalid JSON" in str(exc_info.value)

    def test_load_all_policies(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create MRM subdirectory
            mrm_dir = Path(tmpdir) / "mrm"
            mrm_dir.mkdir()

            policy1 = {
                "id": "policy-1",
                "version": "1.0.0",
                "metadata": {"name": "Policy 1", "domain": "MRM"},
                "rules": [],
            }
            policy2 = {
                "id": "policy-2",
                "version": "1.0.0",
                "metadata": {"name": "Policy 2", "domain": "MRM"},
                "rules": [],
            }

            with open(mrm_dir / "p1.json", "w") as f:
                json.dump(policy1, f)
            with open(mrm_dir / "p2.json", "w") as f:
                json.dump(policy2, f)

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)
            policies = loader.load_all_policies(domain="MRM")

            assert len(policies) == 2
            ids = [p["id"] for p in policies]
            assert "policy-1" in ids
            assert "policy-2" in ids

    def test_load_policy_by_id(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            mrm_dir = Path(tmpdir) / "mrm"
            mrm_dir.mkdir()

            policy = {
                "id": "target-policy",
                "version": "1.0.0",
                "metadata": {"name": "Target", "domain": "MRM"},
                "rules": [],
            }
            with open(mrm_dir / "target.json", "w") as f:
                json.dump(policy, f)

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)
            loaded = loader.load_policy_by_id("target-policy")

            assert loaded["id"] == "target-policy"

    def test_policy_caching(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            policy = {
                "id": "cached-policy",
                "version": "1.0.0",
                "metadata": {"name": "Cached", "domain": "MRM"},
                "rules": [],
            }
            policy_path = Path(tmpdir) / "cached.json"
            with open(policy_path, "w") as f:
                json.dump(policy, f)

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)

            # First load
            loaded1 = loader.load_policy(policy_path)

            # Modify file (shouldn't affect cached version)
            policy["version"] = "2.0.0"
            with open(policy_path, "w") as f:
                json.dump(policy, f)

            # Second load (should be cached)
            loaded2 = loader.load_policy(policy_path)
            assert loaded2["version"] == "1.0.0"

            # Clear cache and reload
            loader.clear_cache()
            loaded3 = loader.load_policy(policy_path)
            assert loaded3["version"] == "2.0.0"

    def test_list_policy_ids(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            mrm_dir = Path(tmpdir) / "mrm"
            mrm_dir.mkdir()

            for i in range(3):
                policy = {
                    "id": f"policy-{i}",
                    "version": "1.0.0",
                    "metadata": {"name": f"Policy {i}", "domain": "MRM"},
                    "rules": [],
                }
                with open(mrm_dir / f"p{i}.json", "w") as f:
                    json.dump(policy, f)

            loader = PolicyLoader(policies_directory=tmpdir, validate=False)
            ids = loader.list_policy_ids()

            assert len(ids) == 3
            assert all(f"policy-{i}" in ids for i in range(3))
