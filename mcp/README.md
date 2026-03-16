# Policy-as-Code MCP Server

An MCP (Model Context Protocol) server that provides tools for managing and evaluating compliance policies for risk management.

## Features

This MCP server exposes the following tools:

| Tool | Description |
|------|-------------|
| `list_policies` | List all policies, optionally filtered by domain (MRM, ERM, CRM) |
| `get_policy` | Get a specific policy by ID with all its rules |
| `create_policy` | Create a new compliance policy |
| `update_policy` | Update an existing policy |
| `delete_policy` | Delete a policy |
| `evaluate` | Evaluate data against a policy for compliance checking |
| `bulk_evaluate` | Evaluate multiple items against policies |
| `get_sample_data` | Get sample data structures for testing |

## Domains

- **MRM** - Model Risk Management (model documentation, validation, monitoring)
- **ERM** - Enterprise Risk Management (risk assessments, risk appetite, reporting)
- **CRM** - Counterparty Risk Management (credit limits, exposure, KYC)

## Prerequisites

1. The Policy-as-Code API must be running on `http://localhost:8000`

   ```bash
   cd /path/to/policy-as-code
   python -m uvicorn src.main:app --reload
   ```

## Installation

```bash
cd mcp
pip install -e .
```

Or install dependencies directly:

```bash
pip install mcp httpx
```

## Claude Code Configuration

Add this to your Claude Code MCP settings. You can do this by running:

```bash
claude mcp add policy-as-code /opt/homebrew/bin/python3.11 /Users/rasalay/git/claude/policy-as-code/mcp/server.py
```

Or manually add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "policy-as-code": {
      "command": "/opt/homebrew/bin/python3.11",
      "args": ["/Users/rasalay/git/claude/policy-as-code/mcp/server.py"],
      "env": {}
    }
  }
}
```

## Usage Examples

Once configured, you can use the tools in Claude Code:

### List all policies
```
Use the list_policies tool to show all available compliance policies
```

### Evaluate a model for compliance
```
Evaluate this model against the mrm-model-documentation policy:
{
  "model": {
    "id": "fraud-detection-v1",
    "documentation": {
      "url": "https://docs.example.com/fraud-v1",
      "lastReviewDate": "2024-06-15"
    }
  }
}
```

### Create a new policy
```
Create a new MRM policy that requires all models to have an approved validation status
```

### Get sample data for testing
```
Show me sample data for testing ERM policies
```

## Development

Run the server directly for testing:

```bash
python server.py
```

The server communicates over stdio using the MCP protocol.
