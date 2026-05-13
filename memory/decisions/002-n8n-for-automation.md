---
name: 002-n8n-for-automation
type: decision
date: 2026-05-13
status: Accepted
---

# ADR 002 — n8n as the Workflow Automation Engine

## Decision
Use n8n (self-hosted via Docker) as the primary workflow automation and integration layer.

## Reasoning
- Visual workflow builder — the India operator can build and modify workflows without writing code
- Self-hosted = no per-task fees (vs. Zapier/Make which charge per operation)
- Native webhook support — connects directly to our FastAPI backend
- 400+ built-in integrations (WhatsApp, Google Sheets, CRM tools, email, etc.)
- Workflows are exportable as JSON — versionable in git
- Can be replaced or supplemented with custom code if needed

## Trade-offs
- Requires Docker to run (small resource overhead)
- Visual tools can become hard to debug for complex logic — use code nodes for heavy logic
- Workflows must be backed up regularly (export JSON to `automation/n8n/`)

## How to Apply
- All business process automations go through n8n first
- Complex AI logic stays in FastAPI services (n8n calls via HTTP Request node)
- Keep n8n workflows simple — one workflow per use case
