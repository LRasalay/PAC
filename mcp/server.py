"""
Policy-as-Code MCP Server

This MCP server provides tools for managing and evaluating compliance policies
for Model Risk Management (MRM), Enterprise Risk Management (ERM), and
Counterparty Risk Management (CRM).
"""

from __future__ import annotations

import json
import httpx
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Create the MCP server
server = Server("policy-as-code")


def make_request(method: str, endpoint: str, data: dict | None = None) -> dict:
    """Make an HTTP request to the Policy-as-Code API."""
    url = f"{API_BASE_URL}{endpoint}"

    with httpx.Client(timeout=30.0) as client:
        if method == "GET":
            response = client.get(url)
        elif method == "POST":
            response = client.post(url, json=data)
        elif method == "PUT":
            response = client.put(url, json=data)
        elif method == "DELETE":
            response = client.delete(url)
        else:
            raise ValueError(f"Unsupported method: {method}")

        if response.status_code >= 400:
            return {"error": response.text, "status_code": response.status_code}

        return response.json()


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="list_policies",
            description="List all compliance policies. Optionally filter by domain (MRM, ERM, CRM).",
            inputSchema={
                "type": "object",
                "properties": {
                    "domain": {
                        "type": "string",
                        "description": "Filter by domain: MRM (Model Risk), ERM (Enterprise Risk), or CRM (Counterparty Risk)",
                        "enum": ["MRM", "ERM", "CRM"]
                    }
                }
            }
        ),
        Tool(
            name="get_policy",
            description="Get a specific policy by its ID. Returns the full policy including all rules.",
            inputSchema={
                "type": "object",
                "properties": {
                    "policy_id": {
                        "type": "string",
                        "description": "The policy ID (e.g., 'mrm-model-documentation')"
                    }
                },
                "required": ["policy_id"]
            }
        ),
        Tool(
            name="create_policy",
            description="Create a new compliance policy with rules for validation.",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "Unique policy ID (lowercase, hyphens allowed)"
                    },
                    "version": {
                        "type": "string",
                        "description": "Version string (e.g., '1.0.0')"
                    },
                    "name": {
                        "type": "string",
                        "description": "Human-readable policy name"
                    },
                    "domain": {
                        "type": "string",
                        "description": "Policy domain: MRM, ERM, or CRM",
                        "enum": ["MRM", "ERM", "CRM"]
                    },
                    "description": {
                        "type": "string",
                        "description": "Policy description"
                    },
                    "severity": {
                        "type": "string",
                        "description": "Policy severity level",
                        "enum": ["critical", "high", "medium", "low"]
                    },
                    "rules": {
                        "type": "array",
                        "description": "Array of rule objects with id, name, conditions, and remediation",
                        "items": {
                            "type": "object"
                        }
                    }
                },
                "required": ["id", "version", "name", "domain", "rules"]
            }
        ),
        Tool(
            name="update_policy",
            description="Update an existing policy.",
            inputSchema={
                "type": "object",
                "properties": {
                    "policy_id": {
                        "type": "string",
                        "description": "The policy ID to update"
                    },
                    "version": {
                        "type": "string",
                        "description": "New version string"
                    },
                    "name": {
                        "type": "string",
                        "description": "Updated policy name"
                    },
                    "description": {
                        "type": "string",
                        "description": "Updated description"
                    },
                    "rules": {
                        "type": "array",
                        "description": "Updated rules array"
                    }
                },
                "required": ["policy_id"]
            }
        ),
        Tool(
            name="delete_policy",
            description="Delete a policy by ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "policy_id": {
                        "type": "string",
                        "description": "The policy ID to delete"
                    }
                },
                "required": ["policy_id"]
            }
        ),
        Tool(
            name="evaluate",
            description="Evaluate data against a policy to check compliance. Returns pass/fail status for each rule.",
            inputSchema={
                "type": "object",
                "properties": {
                    "policy_id": {
                        "type": "string",
                        "description": "The policy ID to evaluate against"
                    },
                    "data": {
                        "type": "object",
                        "description": "The data to evaluate (e.g., model info, risk assessment, counterparty data)"
                    }
                },
                "required": ["policy_id", "data"]
            }
        ),
        Tool(
            name="bulk_evaluate",
            description="Evaluate multiple data items against policies in a single request.",
            inputSchema={
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "description": "Array of evaluation items, each with id, policy_id, and data",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "policy_id": {"type": "string"},
                                "data": {"type": "object"}
                            },
                            "required": ["id", "policy_id", "data"]
                        }
                    },
                    "fail_fast": {
                        "type": "boolean",
                        "description": "Stop on first error if true"
                    }
                },
                "required": ["items"]
            }
        ),
        Tool(
            name="get_sample_data",
            description="Get sample data for testing a policy evaluation. Useful for understanding what data structure a policy expects.",
            inputSchema={
                "type": "object",
                "properties": {
                    "domain": {
                        "type": "string",
                        "description": "Domain for sample data: MRM, ERM, or CRM",
                        "enum": ["MRM", "ERM", "CRM"]
                    }
                },
                "required": ["domain"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls."""

    try:
        if name == "list_policies":
            domain = arguments.get("domain")
            endpoint = "/policies"
            if domain:
                endpoint += f"?domain={domain}"
            result = make_request("GET", endpoint)

        elif name == "get_policy":
            policy_id = arguments["policy_id"]
            result = make_request("GET", f"/policies/{policy_id}")

        elif name == "create_policy":
            policy = {
                "id": arguments["id"],
                "version": arguments["version"],
                "metadata": {
                    "name": arguments["name"],
                    "domain": arguments["domain"],
                    "description": arguments.get("description"),
                    "severity": arguments.get("severity", "medium")
                },
                "rules": arguments["rules"]
            }
            result = make_request("POST", "/policies", policy)

        elif name == "update_policy":
            policy_id = arguments.pop("policy_id")
            update_data = {}
            if "version" in arguments:
                update_data["version"] = arguments["version"]
            if "name" in arguments or "description" in arguments:
                update_data["metadata"] = {}
                if "name" in arguments:
                    update_data["metadata"]["name"] = arguments["name"]
                if "description" in arguments:
                    update_data["metadata"]["description"] = arguments["description"]
            if "rules" in arguments:
                update_data["rules"] = arguments["rules"]
            result = make_request("PUT", f"/policies/{policy_id}", update_data)

        elif name == "delete_policy":
            policy_id = arguments["policy_id"]
            result = make_request("DELETE", f"/policies/{policy_id}")
            if result == {}:
                result = {"status": "deleted", "policy_id": policy_id}

        elif name == "evaluate":
            eval_request = {
                "policy_id": arguments["policy_id"],
                "data": arguments["data"]
            }
            result = make_request("POST", "/evaluate", eval_request)

        elif name == "bulk_evaluate":
            bulk_request = {
                "items": arguments["items"],
                "fail_fast": arguments.get("fail_fast", False)
            }
            result = make_request("POST", "/evaluate/bulk", bulk_request)

        elif name == "get_sample_data":
            domain = arguments["domain"]
            if domain == "MRM":
                result = {
                    "description": "Sample Model Risk Management data",
                    "sample_data": {
                        "model": {
                            "id": "credit-score-v2",
                            "owner": "Data Science Team",
                            "documentation": {
                                "url": "https://docs.example.com/models/cs-v2",
                                "lastReviewDate": "2024-06-15"
                            },
                            "validation": {
                                "status": "approved",
                                "completedDate": "2024-05-01"
                            },
                            "monitoring": {
                                "enabled": True,
                                "lastReportDate": "2024-06-01"
                            },
                            "riskRating": "medium"
                        }
                    }
                }
            elif domain == "ERM":
                result = {
                    "description": "Sample Enterprise Risk Management data",
                    "sample_data": {
                        "businessUnit": {
                            "id": "BU-001",
                            "name": "Retail Banking",
                            "riskAssessment": {
                                "completedDate": "2024-06-15",
                                "categories": ["operational", "credit", "market"],
                                "highRiskCount": 2,
                                "criticalRiskCount": 0,
                                "allRisksHaveOwners": True,
                                "mitigationPlans": [{"risk": "R1", "plan": "Mitigation 1"}]
                            }
                        },
                        "metrics": {
                            "operationalLoss": {"quarterlyTotal": 5000000},
                            "creditRisk": {"utilizationPercent": 75},
                            "liquidity": {"coverageRatio": 120}
                        }
                    }
                }
            elif domain == "CRM":
                result = {
                    "description": "Sample Counterparty Risk Management data",
                    "sample_data": {
                        "counterparty": {
                            "id": "CP-001",
                            "name": "Acme Corporation",
                            "limit": {
                                "approved": True,
                                "amount": 10000000,
                                "lastReviewDate": "2024-06-15"
                            },
                            "exposure": {
                                "current": 7500000,
                                "utilizationPercent": 75
                            },
                            "creditRating": {"internal": "A"},
                            "kyc": {
                                "status": "complete",
                                "lastUpdateDate": "2024-06-01"
                            }
                        }
                    }
                }
            else:
                result = {"error": f"Unknown domain: {domain}"}
        else:
            result = {"error": f"Unknown tool: {name}"}

        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    except httpx.ConnectError:
        return [TextContent(
            type="text",
            text=json.dumps({
                "error": "Cannot connect to Policy-as-Code API",
                "hint": "Make sure the API server is running on http://localhost:8000"
            }, indent=2)
        )]
    except Exception as e:
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e)}, indent=2)
        )]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
