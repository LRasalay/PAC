# Policy-as-Code

<div align="center">

![PolicyHub](https://img.shields.io/badge/PolicyHub-Risk%20Management-blue?style=for-the-badge&logo=shield)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=for-the-badge&logo=angular&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A modern policy-as-code platform for enterprise risk management and compliance automation**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [API](#api-reference) • [MCP Integration](#mcp-integration)

</div>

---

## Overview

Policy-as-Code transforms compliance from manual, error-prone processes into automated, version-controlled workflows. Define your compliance rules as JSON policies, enforce them via REST API, and integrate with any system—including AI assistants through MCP.

### Supported Risk Domains

| Domain | Description |
|--------|-------------|
| **MRM** | Model Risk Management - Model documentation, validation, and monitoring requirements |
| **ERM** | Enterprise Risk Management - Risk assessments, appetite thresholds, and reporting |
| **CRM** | Counterparty Risk Management - Credit limits, exposure monitoring, and KYC compliance |

---

## Features

### Core Capabilities

- **📝 Policies as Code** - Define compliance rules in version-controlled JSON schemas
- **⚡ Real-time Evaluation** - Instant compliance checks via REST API (<50ms response time)
- **🔗 Universal Integration** - Works with any system through API or MCP
- **📊 Full Audit Trail** - Every evaluation logged for compliance reporting
- **🤖 AI-Ready** - MCP integration for Claude Code and Claude Desktop

### Rule Engine

The powerful rule engine supports:

| Category | Operators |
|----------|-----------|
| **Existence** | `exists`, `not_exists`, `is_empty`, `is_not_empty` |
| **Comparison** | `equals`, `not_equals`, `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal` |
| **Collections** | `in`, `not_in`, `contains`, `contains_all`, `contains_any` |
| **Patterns** | `matches`, `starts_with`, `ends_with` |
| **Temporal** | `date_before`, `date_after`, `date_within` |
| **Logic** | `all`, `any`, `not` (for complex boolean conditions) |

### Conditional Rules

Rules can include `when` clauses for conditional evaluation:

```json
{
  "id": "high-risk-approval",
  "when": {
    "path": "$.entity.riskLevel",
    "operator": "equals",
    "value": "high"
  },
  "conditions": {
    "path": "$.entity.approval.status",
    "operator": "equals",
    "value": "approved"
  }
}
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (for UI)
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/LRasalay/PAC.git
cd PAC

# Install Python dependencies
pip install -e .

# Start the API server
uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`

### Running the UI

```bash
cd ui
npm install
npm start
```

The UI will be available at `http://localhost:4200`

### Using Docker

```bash
docker-compose up -d
```

---

## Documentation

### Policy Schema

Policies are defined in JSON with the following structure:

```json
{
  "id": "mrm-model-documentation",
  "version": "1.0.0",
  "metadata": {
    "name": "Model Documentation Requirements",
    "domain": "MRM",
    "description": "Ensures all models have proper documentation",
    "owner": "Model Risk Team",
    "severity": "high",
    "effectiveDate": "2024-01-01",
    "tags": ["documentation", "compliance"]
  },
  "rules": [
    {
      "id": "doc-001",
      "name": "Documentation URL required",
      "type": "required_field",
      "conditions": {
        "path": "$.model.documentation.url",
        "operator": "exists"
      },
      "remediation": "Provide a valid documentation URL for the model"
    },
    {
      "id": "doc-002",
      "name": "Annual review required",
      "type": "temporal",
      "conditions": {
        "path": "$.model.documentation.lastReviewDate",
        "operator": "date_within",
        "value": "365d"
      },
      "remediation": "Model documentation must be reviewed annually"
    }
  ]
}
```

### JSONPath Support

The engine uses JSONPath for flexible data access:

| Pattern | Description |
|---------|-------------|
| `$.field` | Root-level field |
| `$.parent.child` | Nested field |
| `$.array[0]` | Array index |
| `$.array[*].field` | All elements in array |
| `$..field` | Recursive search |

---

## API Reference

### Base URL

```
http://localhost:8000/api/v1
```

### Endpoints

#### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/policies` | List all policies |
| `GET` | `/policies?domain=MRM` | List policies by domain |
| `GET` | `/policies/{id}` | Get policy by ID |
| `POST` | `/policies` | Create policy |
| `PUT` | `/policies/{id}` | Update policy |
| `DELETE` | `/policies/{id}` | Delete policy |

#### Evaluation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/evaluate` | Evaluate data against a policy |
| `POST` | `/evaluate/bulk` | Bulk evaluation |
| `GET` | `/evaluate/{id}/history` | Evaluation history |

### Example: Evaluate Compliance

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "mrm-model-documentation",
    "data": {
      "model": {
        "id": "credit-score-v2",
        "documentation": {
          "url": "https://docs.example.com/models/cs-v2",
          "lastReviewDate": "2024-06-15"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "compliant": true,
  "policy_id": "mrm-model-documentation",
  "evaluated_at": "2024-07-01T10:30:00Z",
  "summary": {
    "total": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "errors": 0
  },
  "results": [
    {
      "rule_id": "doc-001",
      "rule_name": "Documentation URL required",
      "status": "pass",
      "message": "Condition satisfied"
    },
    {
      "rule_id": "doc-002",
      "rule_name": "Annual review required",
      "status": "pass",
      "message": "Condition satisfied"
    }
  ]
}
```

### OpenAPI Documentation

Interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/api/v1/docs`
- **ReDoc:** `http://localhost:8000/api/v1/redoc`

---

## MCP Integration

The Policy-as-Code system includes an MCP (Model Context Protocol) server for integration with Claude Code and Claude Desktop.

### Available Tools

| Tool | Description |
|------|-------------|
| `list_policies` | List all available policies |
| `get_policy` | Get details of a specific policy |
| `create_policy` | Create a new policy |
| `update_policy` | Update an existing policy |
| `delete_policy` | Delete a policy |
| `evaluate` | Evaluate data against a policy |
| `bulk_evaluate` | Evaluate multiple items |
| `get_sample_data` | Get sample data for testing |

### Setup for Claude Code

```bash
claude mcp add policy-as-code -s user -- /opt/homebrew/bin/python3.11 /path/to/mcp/server.py
```

### Setup for Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "policy-as-code": {
      "command": "/opt/homebrew/bin/python3.11",
      "args": ["/path/to/mcp/server.py"]
    }
  }
}
```

### Example Usage in Claude

```
"Check if this model configuration is compliant with MRM policies"

"List all high-severity policies in the ERM domain"

"Evaluate this counterparty data against credit limit policies"
```

---

## Project Structure

```
policy-as-code/
├── src/                          # Backend source code
│   ├── api/v1/                   # REST API endpoints
│   │   └── endpoints/
│   │       ├── policies.py       # Policy CRUD
│   │       ├── evaluation.py     # Compliance evaluation
│   │       └── bulk.py           # Bulk operations
│   ├── core/
│   │   ├── engine/               # Rule evaluation engine
│   │   │   ├── rule_engine.py    # Core engine
│   │   │   └── operators.py      # Operator implementations
│   │   └── policy/               # Policy management
│   │       ├── loader.py         # Policy loading
│   │       └── validator.py      # Schema validation
│   ├── models/                   # Data models
│   └── services/                 # Business logic
├── ui/                           # Angular frontend
│   └── src/app/
│       ├── components/           # UI components
│       ├── services/             # API services
│       └── models/               # TypeScript models
├── mcp/                          # MCP server
│   └── server.py                 # Claude integration
├── policies/                     # Policy definitions
│   ├── schemas/                  # JSON Schema
│   ├── mrm/                      # MRM policies
│   ├── erm/                      # ERM policies
│   └── crm/                      # CRM policies
├── presentation/                 # Project presentation
├── tests/                        # Test suite
└── config/                       # Configuration
```

---

## Sample Policies

The repository includes sample policies for each domain:

### MRM (Model Risk Management)
- `model-documentation.json` - Documentation requirements
- `model-validation.json` - Validation standards
- `model-monitoring.json` - Monitoring requirements

### ERM (Enterprise Risk Management)
- `risk-assessment.json` - Risk assessment requirements
- `risk-appetite.json` - Risk appetite thresholds

### CRM (Counterparty Risk Management)
- `counterparty-limits.json` - Credit limit policies
- `credit-assessment.json` - Credit assessment requirements

---

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/unit/test_rule_engine.py
```

### Code Quality

```bash
# Format code
black src tests

# Type checking
mypy src

# Linting
ruff check src
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Angular   │────▶│   FastAPI   │────▶│    Rule     │
│     UI      │     │   REST API  │     │   Engine    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Policy    │     │   Audit     │
                    │    Store    │     │    Log      │
                    └─────────────┘     └─────────────┘
                           ▲
                           │
                    ┌─────────────┐
                    │ MCP Server  │◀──── Claude Code
                    └─────────────┘      Claude Desktop
```

---

## Roadmap

- [x] **Phase 1:** Core engine, REST API, Web UI, MCP integration
- [ ] **Phase 2:** PDF extraction, policy versioning with diff tracking
- [ ] **Phase 3:** Webhook notifications, scheduled evaluations
- [ ] **Phase 4:** ML-powered policy suggestions, cross-policy analytics

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for enterprise compliance**

[Report Bug](https://github.com/LRasalay/PAC/issues) • [Request Feature](https://github.com/LRasalay/PAC/issues)

</div>
