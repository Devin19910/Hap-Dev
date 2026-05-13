# AI AUTOMATION COMPANY — MASTER ENGINEERING DIRECTIVE

## What We Are Building
A scalable AI Automation Operations Platform serving businesses in India and the United States.
This is NOT a collection of scripts. It is an enterprise-ready, modular, reusable infrastructure
that will eventually power SaaS products, white-label client deployments, and AI agent workflows.

## Team
- Owner/Architect (US): handles infrastructure, APIs, architecture decisions, funding
- Operator/Cousin (India, Punjab — Chandigarh/Ludhiana area): handles client delivery, day-to-day ops
- AI pair: Claude Code + Cursor AI as the engineering environment

---

## Platform Vision
This platform will support:
- WhatsApp AI assistants
- Business workflow automation (n8n)
- CRM integrations
- AI lead handling & appointment booking
- AI customer support bots
- AI content generation systems
- Reusable client deployment templates
- Internal business operations tooling

### Reusable Templates (clone per client type)
- Salons / Barbershops
- Clinics / Dentists
- Gyms / Fitness
- Immigration consultants
- Trucking companies
- Local / Service businesses

---

## Tech Stack

### Backend
- Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- Alembic (database migrations)
- Docker + Docker Compose

### Frontend
- Next.js 16 (React), Tailwind CSS
- Vercel deployment

### Automation
- n8n (self-hosted, Dockerized)
- Webhooks (FastAPI endpoints)
- API integrations (WhatsApp, CRM, calendars)

### AI APIs
- Anthropic Claude (default — claude-sonnet-4-6)
- OpenAI (gpt-4o-mini)
- Google Gemini (gemini-2.5-flash)

### Infrastructure
- WSL2 (Ubuntu) on Windows 11 Pro
- Docker Desktop
- Git + GitHub (Devin19910/Hap-Dev)
- Future: cloud VPS or spare 32GB/1TB laptop as server

---

## Folder Structure

```
backend/app/api/          → API route handlers
backend/app/services/     → Business logic & AI integrations
backend/app/models/       → SQLAlchemy DB models
backend/app/utils/        → Shared helpers, auth, config
automation/n8n/           → Exported n8n workflow JSON templates
automation/webhooks/      → Webhook handler docs & templates
automation/integrations/  → Third-party integration guides
database/migrations/      → Alembic migration files
database/schemas/         → Raw SQL schema references
database/seeds/           → Seed data for dev/testing
frontend/app/             → Next.js pages (landing + dashboard)
docs/architecture/        → System design docs
docs/setup/               → Environment setup guides
docs/api/                 → API endpoint documentation
prompts/business/         → Reusable prompts for client deliverables
prompts/ai_workflows/     → Prompts that drive automation pipelines
prompts/coding/           → Prompts for engineering tasks
memory/decisions/         → Architecture Decision Records (ADRs)
memory/lessons/           → Hard-won lessons, gotchas, fixes
internal_tools/scripts/   → Dev helpers, deployment utilities
internal_tools/admin/     → Admin panel utilities
sops/                     → Standard Operating Procedures
```

---

## Engineering Principles

### 1. Clean Architecture
- Separate routes / services / models / utilities — never mix concerns
- One file = one responsibility
- Prefer reusable modules over one-off code

### 2. Environment Safety
- Zero hardcoded secrets — everything in `.env`
- `.env` is always gitignored
- `.env.example` is the template (no real values)

### 3. Documentation Standard
Every major feature must include:
- What it does
- How to set it up
- How to troubleshoot it

### 4. AI-Readable Codebase
- Consistent naming conventions
- Clear folder responsibilities
- CLAUDE.md always up to date
- Inline comments only for non-obvious logic

### 5. Reusability First
- Every automation is a reusable module
- Every client setup follows a template
- Every SOP is written so someone new can follow it

### 6. Beginner-Friendly
- The India operator must be able to follow every SOP independently
- Avoid clever/obscure code
- Prefer readable over terse

---

## Development Priorities

| Priority | Area | Status |
|---|---|---|
| 1 | Backend foundation (FastAPI, Docker, PostgreSQL, health checks) | ✅ Done |
| 2 | AI service layer (Claude, OpenAI, Gemini router) | ✅ Done |
| 3 | Client & subscription management | ✅ Done |
| 4 | n8n workflow automation + webhooks | 🔄 In Progress |
| 5 | Database migrations (Alembic) | 🔄 In Progress |
| 6 | Authentication system (JWT) | 🔄 In Progress |
| 7 | Admin dashboard | 🔜 Planned |
| 8 | WhatsApp AI integration | 🔜 Planned |
| 9 | CRM integrations | 🔜 Planned |
| 10 | SaaS multi-tenant layer | 🔜 Planned |

---

## SOP Philosophy
This project operates like a real company. SOPs exist for:
- Deployment (backend, frontend, n8n)
- Client onboarding
- Debugging & troubleshooting
- Backup strategies
- API key management
- Automation setup
- New developer onboarding

---

## Long-Term Goal
We are building:
- A scalable AI automation company
- An AI operations infrastructure
- A reusable automation ecosystem
- A future SaaS foundation
- An AI-assisted engineering environment

Think like a long-term technical partner, not a one-shot code generator.
