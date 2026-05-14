# NEXORA — MASTER ENGINEERING DIRECTIVE

## What We Are Building
**Nexora** is a SaaS AI Automation Operations Platform for local businesses in India and the US.
It connects a WhatsApp AI assistant to each business — handling inquiries, booking appointments,
capturing leads, and syncing to CRM and calendars automatically.

This is NOT a collection of scripts. It is a multi-tenant, enterprise-ready platform that powers:
- Self-service SaaS subscriptions (tenants sign up, configure, and go)
- White-label client deployments (operator sets up on behalf of clients)
- Reusable automation templates per business type

**Brand:** Nexora
**GitHub:** Devin19910/Hap-Dev

---

## Team
- **Owner/Architect (US):** infrastructure, APIs, architecture decisions, funding
- **Operator/Cousin (India, Punjab — Chandigarh/Ludhiana area):** client delivery, day-to-day ops
- **AI pair:** Claude Code + Cursor AI as the engineering environment

---

## Tech Stack

### Backend
- Python 3.12, FastAPI, SQLAlchemy 2.x, PostgreSQL 15
- Alembic (database migrations — auto-applied on startup)
- bcrypt (password hashing), python-jose (JWT, HS256)
- httpx (async HTTP for external API calls)
- Docker + Docker Compose

### Frontend
- Next.js 16 (App Router), React, TypeScript
- Tailwind CSS (`brand-500` = `#0ea5e9`)
- Vercel deployment

### Automation
- n8n (self-hosted, Dockerized) — workflow engine for CRM triggers, reminders
- Webhooks: FastAPI endpoints receive Meta WhatsApp events
- API integrations: WhatsApp Cloud API, HubSpot, Zoho CRM, Google Calendar

### AI APIs
- **Anthropic Claude** (default — `claude-sonnet-4-6`)
- **OpenAI** (`gpt-4o-mini`)
- **Google Gemini** (`gemini-2.5-flash`)
- All three are routed through `ai_router.py` — switch via `DEFAULT_AI_PROVIDER` env var

### Infrastructure
- **Dev:** WSL2 (Ubuntu) on Windows 11 Pro + Docker Desktop
- **Production:** Spare laptop running Ubuntu 24.04 LTS as home server
- **Frontend hosting:** Vercel (auto-deploy from GitHub)
- **Internet exposure:** Cloudflare Tunnel (primary) or port forwarding + DuckDNS (fallback)

---

## Folder Structure

```
backend/
  app/
    api/              → FastAPI route handlers (one file per domain)
    services/         → Business logic & external API integrations
    models/           → SQLAlchemy ORM models
    utils/            → Auth, config, tenant config helpers
  alembic/
    versions/         → Database migration scripts (auto-applied on startup)
  alembic.ini         → Alembic config

frontend/
  app/
    page.tsx          → Landing page (Nexora marketing site)
    login/page.tsx    → Login page
    register/page.tsx → Self-service tenant registration
    dashboard/page.tsx → Full admin dashboard (platform + tenant views)
    layout.tsx        → Root layout + SEO metadata
    globals.css       → Global Tailwind styles

automation/
  n8n/               → Exported n8n workflow JSON templates
  webhooks/          → Webhook handler documentation
  integrations/      → Third-party integration guides

nginx/
  nginx.conf         → Reverse proxy config (used with port-forwarding deployment)

docker/
  docker-compose.yml → Local dev stack (hot-reload, source volume mount)

docker-compose.prod.yml → Production stack (built image, no volume mount, healthchecks)
deploy.sh              → One-command update script: git pull → rebuild → restart

sops/                → Standard Operating Procedures (written for the India operator)

database/
  migrations/        → Alembic migration history
  schemas/           → Raw SQL schema references
  seeds/             → Seed data for dev/testing

docs/                → Architecture, setup, API documentation
prompts/             → Reusable AI prompts (business, workflows, coding)
memory/              → Architecture Decision Records, lessons learned
internal_tools/      → Admin scripts, deployment utilities
```

---

## What Has Been Built (Complete Feature Inventory)

### 1. Backend Foundation ✅
- FastAPI app with CORS middleware
- PostgreSQL via SQLAlchemy (connection pooling)
- Docker Compose with `backend`, `postgres`, `n8n` services
- Health check endpoint: `GET /health`
- Alembic auto-migration on startup (`on_startup` hook)
- Seed admin account created on first boot if no users exist

### 2. AI Service Layer ✅
- **`ai_router.py`** — routes to Claude, OpenAI, or Gemini based on provider string
- **`claude_service.py`** — Anthropic Messages API
- **`openai_service.py`** — OpenAI Chat Completions
- **`gemini_service.py`** — Google Gemini API
- All services accept `prompt` + `system_prompt`, return `{response, tokens_used}`
- Usage tracked per client in `automation_jobs` table
- API: `POST /ai/complete`, `GET /ai/jobs/{client_id}`

### 3. Client & Subscription Management ✅
- **Client model:** id, name, email, slug, api_key (UUID), status, business_type,
  is_active, owner_user_id, plus all per-tenant credential fields (see model details)
- **Subscription model:** tier (free/basic/pro/business), monthly_limit, requests_used, is_active
- API:
  - `POST /clients` — create client
  - `GET /clients` — list all clients
  - `GET /clients/{id}` — get client
  - `DELETE /clients/{id}` — deactivate client
  - `GET /subscriptions/{client_id}` — get subscription
  - `PATCH /subscriptions/{client_id}/upgrade` — change tier
  - `POST /subscriptions/{client_id}/reset` — reset monthly usage counter

### 4. Authentication System ✅
- JWT Bearer tokens (HS256, 8-hour expiry)
- bcrypt password hashing
- Platform admin roles: `owner` (full access), `operator` (all except user management)
- Tenant admin roles: `tenant_owner`, `tenant_operator` (scoped to their tenant only)
- `AdminUser.tenant_id = null` → platform admin; `tenant_id = client.id` → tenant admin
- Auth dependencies:
  - `get_current_user` — validates JWT, returns AdminUser
  - `require_owner` — platform owner only
  - `require_any_auth` — accepts JWT Bearer OR `x-api-key` header (for n8n backward compat)
  - `require_platform_admin` — rejects tenant admins
  - `get_tenant_scope` — returns tenant_id from JWT (None for platform admins and API key auth)
- Admin seed: first boot creates `admin@example.com` (configurable via env vars)
- API:
  - `POST /auth/token` — login (OAuth2PasswordRequestForm → JWT)
  - `GET /auth/me` — get current user
  - `POST /auth/users` — create admin user (owner only)
  - `GET /auth/users` — list admin users (owner only)

### 5. WhatsApp Cloud API Integration ✅
- Meta Graph API v19.0
- **`whatsapp_service.py`** — `send_message(to, text, *, phone_number_id, access_token)`
- Global webhook: `GET/POST /webhooks/whatsapp` (uses global .env credentials)
- Per-tenant webhook: `GET/POST /webhooks/whatsapp/{tenant_id}` (uses client's credentials)
- Webhook flow on incoming message:
  1. Verify Meta signature
  2. Extract message body + sender phone
  3. Upsert WhatsApp conversation record
  4. Run AI triage (intent, urgency, suggested reply, summary, service_type, requested_time)
  5. Send AI reply via WhatsApp
  6. Upsert CRM contact (with intent/urgency/summary)
  7. If intent = "booking" → create pending Appointment
  8. Fire n8n CRM webhook (async background task)
- Triage prompt classifies: `intent` (inquiry/booking/complaint/support/other),
  `urgency` (low/medium/high), `suggested_reply`, `summary`, `service_type`, `requested_time`

### 6. Conversations ✅
- **`WhatsAppConversation` model:** phone_number, client_id, display_name, last_message,
  last_reply, last_intent, message_count, created_at, updated_at
- API:
  - `GET /conversations` — list all (platform admin) or own tenant's (tenant admin)
  - `GET /conversations/{client_id}` — conversations for a specific client

### 7. CRM Integrations ✅
- **Internal CRM** (always on — no setup needed)
- **HubSpot** (`hubspot_service.py`) — search by phone, create/update contacts via Private App token
- **Zoho CRM** (`zoho_service.py`) — OAuth2 refresh token flow, create/update Leads
- **`crm_service.py`** — `upsert_contact(db, phone, client_id, cfg)` — creates/updates internal
  contact, then syncs to HubSpot + Zoho if configured; fires n8n new lead webhook
- **`Contact` model:** phone_number, email, first_name, last_name, source, crm_hubspot_id,
  crm_zoho_id, last_intent, last_urgency, last_summary, notes, tags,
  status (new/contacted/qualified/converted/lost)
- API:
  - `GET /contacts` — list (tenant-scoped)
  - `GET /contacts/{id}` — get contact
  - `POST /contacts` — create contact
  - `PATCH /contacts/{id}` — update contact
  - `DELETE /contacts/{id}` — delete contact
  - `POST /contacts/{id}/sync` — manually push to HubSpot + Zoho

### 8. Appointment Booking System ✅
- AI detects booking intent in WhatsApp message → creates pending Appointment
- Operator confirms in dashboard → syncs to Google Calendar
- **`appointment_service.py`** — `create_pending()`, `confirm()`, `cancel()`, `send_reminder()`
- **`google_calendar_service.py`** — OAuth2 refresh token, create/update/delete events
- **`Appointment` model:** client_id, contact_id, phone_number, customer_name, service, notes,
  requested_at_text, scheduled_at (DateTime), duration_minutes, status
  (pending/confirmed/completed/cancelled), google_event_id, reminder_sent
- API:
  - `GET /appointments` — list (tenant-scoped), filterable by status/client
  - `GET /appointments/{id}` — get appointment
  - `POST /appointments` — create appointment
  - `PATCH /appointments/{id}` — update appointment
  - `POST /appointments/{id}/confirm` — confirm + sync to Google Calendar
  - `POST /appointments/{id}/cancel` — cancel + delete from Google Calendar
  - `POST /appointments/{id}/send-reminder` — send WhatsApp reminder message

### 9. SaaS Multi-Tenant Layer ✅
- **Self-service registration:** `POST /tenants/register` (public) — creates Client + free
  Subscription + tenant_owner AdminUser in one transaction, returns JWT
- **Per-tenant credentials:** each Client stores its own WhatsApp, HubSpot, Zoho, Google Calendar,
  and AI provider credentials; all services fall back to global .env if not set
- **`TenantConfig` dataclass** (`utils/tenant_config.py`) — `build_tenant_config(client)` builds
  per-tenant config with fallback to global settings
- **Data isolation:** `get_tenant_scope` dependency — tenant admins auto-scoped to their tenant_id;
  platform admins see all data
- **Tenant management API:**
  - `GET /tenants` — list all tenants (platform admin)
  - `GET /tenants/{id}` — get tenant details (platform admin or own tenant)
  - `PUT /tenants/{id}/config` — update per-tenant credentials
  - `POST /tenants/{id}/suspend` / `activate` (platform admin)
  - `GET /tenants/{id}/usage` — subscription usage stats

### 10. n8n Workflow Automation ✅
- **`ai_triage_workflow.json`** — receives WhatsApp webhook, runs triage, sends reply
- **`crm_new_lead_workflow.json`** — receives new lead webhook, extracts contact data
- **`appointment_reminder_workflow.json`** — Webhook → Wait 24h → POST send-reminder
- Webhook trigger: `POST /webhooks/n8n/trigger` — accepts arbitrary payload for manual n8n triggers
- n8n runs at `http://localhost:5678` (Docker container)

### 11. AI Calling Agent (Vapi) ✅
- **`calling_service.py`** — Vapi API integration: `make_outbound_call`, `get_call`, `list_calls`
- **`models/call_log.py`** — CallLog ORM model (direction, status, transcript, recording_url, duration_seconds, vapi_call_id)
- **Business tier** — `tier="business"`, monthly_limit=99999 (unlimited); enforced on `/calls/outbound`
- Per-tenant credentials: `vapi_api_key`, `vapi_phone_number_id` (stored on Client, fallback to global .env)
- API:
  - `GET /calls` — list call logs (tenant-scoped)
  - `GET /calls/{id}` — get single call log
  - `POST /calls/outbound` — trigger outbound AI call (Business tier only)
  - `POST /webhooks/vapi` — public webhook; handles `end-of-call-report` + `status-update` events
- Dashboard: **Calls tab** — outbound dialer + call history with transcripts + recording links
- Settings: Vapi API Key + Phone Number ID fields added to tenant Settings tab
- Pricing: **Business plan** ($199/mo) added as 4th tier on landing page

### 12. Production Deployment Setup ✅
- **`backend/Dockerfile`** — production build: 2 Uvicorn workers, no `--reload`
- **`docker/docker-compose.yml`** — dev stack: source volume mount + `--reload` command override
- **`docker-compose.prod.yml`** — production stack run from repo root; postgres not exposed
  externally; backend healthcheck; all services `restart: unless-stopped`
- **`nginx/nginx.conf`** — optional reverse proxy for `api.yourdomain.com` +
  `n8n.yourdomain.com`; WebSocket support for n8n; Certbot ACME challenge location
- **`deploy.sh`** — `git pull` → `build backend` → `up -d` → health check wait → status print
- **Internet exposure options:**
  - **Cloudflare Tunnel** (primary — no port forwarding, no static IP, free HTTPS)
  - **Port forwarding + DuckDNS + Certbot** (fallback)

### 12. Frontend — Nexora Landing Page ✅
- **`/`** — full marketing page: sticky nav, hero, integration logos bar, How It Works (3 steps),
  Industries (Salons, Clinics, Gyms, Immigration, Plumbers, Real Estate — pain points + feature wins), Features grid (6),
  Pricing (Free/Basic/Pro with feature lists), final CTA, footer
- All CTAs link to `/register` (self-service flow)
- Tailwind CSS, server component (no client-side JS on landing page)

### 13. Frontend — Authentication Pages ✅
- **`/login`** — email + password → `POST /auth/token` → localStorage JWT → `/dashboard`
  Auto-redirects to `/dashboard` if JWT already stored
- **`/register`** — business name, type, email, password → `POST /tenants/register` →
  auto-login → `/dashboard`
  Business types: general, salon, clinic, gym, immigration, trucking, restaurant, other

### 14. Frontend — Admin Dashboard ✅
- **`/dashboard`** — full SPA; checks JWT on load, redirects to `/login` if missing
- **Sidebar navigation** — platform admins see all tabs; tenant admins see only their tabs
- **Platform-admin-only tabs:** Clients, Tenants, Team
- **Tenant-visible tabs:** Overview, WhatsApp, Contacts, Appointments, Calls, Settings

**Dashboard tabs:**

| Tab | What it does |
|---|---|
| Overview | Stats: total clients, AI jobs, token usage, recent activity |
| Clients | CRUD for clients; view subscription, jobs, upgrade/reset usage (platform admin) |
| Jobs | Browse all AI jobs by client; shows prompt, response, tokens |
| WhatsApp | View all conversations with intent/urgency badges; message history |
| Contacts | CRM contacts table; search/filter; edit details, status; sync to HubSpot/Zoho |
| Appointments | Pending/confirmed/completed list; confirm with date+time; Google Calendar sync status |
| Calls | AI calling agent — outbound dialer, call history, transcripts, recordings (Business plan) |
| Settings | Tenant owner updates their own WhatsApp, HubSpot, Zoho, Google Calendar, AI provider, Vapi config |
| Tenants | Platform admin: browse all tenants, view integration status, suspend/activate |
| Team | Platform owner: create/list platform admin users |

---

## Database Models

| Model | File | Key Fields |
|---|---|---|
| Client (Tenant) | `models/client.py` | id, name, email, slug, api_key, status, business_type, is_active, owner_user_id, wa_phone_number_id, wa_access_token, wa_verify_token, hubspot_api_key, zoho_*, google_*, ai_provider, vapi_api_key, vapi_phone_number_id |
| AdminUser | `models/admin_user.py` | id, email, hashed_password, first_name, last_name, role, tenant_id (null=platform admin), is_active |
| Subscription | `models/subscription.py` | id, client_id, tier, monthly_limit, requests_used, is_active |
| AutomationJob | `models/automation_job.py` | id, client_id, provider, prompt, response, tokens_used, status |
| WhatsAppConversation | `models/whatsapp_conversation.py` | id, phone_number, client_id, display_name, last_message, last_reply, last_intent, message_count |
| Contact | `models/contact.py` | id, client_id, phone_number, email, first_name, last_name, source, crm_hubspot_id, crm_zoho_id, last_intent, last_urgency, last_summary, status |
| Appointment | `models/appointment.py` | id, client_id, contact_id, phone_number, customer_name, service, scheduled_at, duration_minutes, status, google_event_id, reminder_sent |
| CallLog | `models/call_log.py` | id, client_id, contact_id, phone_number, direction, status, duration_seconds, transcript, recording_url, vapi_call_id, ended_reason |

---

## Alembic Migrations (Applied in Order)

| Migration | What it adds |
|---|---|
| `8b847fa53847` | Initial schema — clients, subscriptions, automation_jobs |
| `b023c3d34530` | admin_users table |
| `72940979d955` | whatsapp_conversations table |
| `c3f1a8b29e04` | contacts table |
| `f4e7d2c1b9a0` | appointments table |
| `e9b4d7f2a031` | ~20 tenant fields on clients + tenant_id on admin_users |
| `a1b2c3d4e5f6` | call_logs table + vapi_api_key/vapi_phone_number_id on clients |

Migrations run automatically when the backend starts (`alembic upgrade head` in `on_startup`).

---

## Environment Variables (`.env`)

Copy `.env.example` → `.env` and fill in real values. Never commit `.env`.

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/ai_automation

# API Security
API_SECRET_KEY=your-long-random-secret
JWT_SECRET_KEY=your-jwt-secret          # falls back to API_SECRET_KEY if omitted
WEBHOOK_SECRET=your-webhook-secret

# Seed admin (created on first boot)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password
ADMIN_FIRST_NAME=Admin

# AI providers
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEFAULT_AI_PROVIDER=claude              # claude | openai | gemini

# Global WhatsApp (used if tenant has no per-tenant credentials)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=whatsapp-verify-changeme
WHATSAPP_CLIENT_ID=                     # which client_id owns this number
WHATSAPP_BUSINESS_NAME=Nexora

# Global HubSpot (used if tenant has no per-tenant credentials)
HUBSPOT_API_KEY=

# Global Zoho CRM (used if tenant has no per-tenant credentials)
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=

# Global Google Calendar (used if tenant has no per-tenant credentials)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
GOOGLE_TIMEZONE=Asia/Kolkata

# n8n
N8N_USER=admin
N8N_PASSWORD=changeme
N8N_NEW_LEAD_WEBHOOK=http://n8n:5678/webhook/new-lead
N8N_APPOINTMENT_WEBHOOK=http://n8n:5678/webhook/appointment-confirmed
```

---

## SOPs Written

All in `sops/` — written so the India operator can follow them independently.

| File | Covers |
|---|---|
| `deployment_process.md` | Docker Compose setup, starting backend + n8n, Vercel frontend deploy |
| `server_deployment.md` | Full home-server deployment: Ubuntu setup, Docker, Cloudflare Tunnel, HTTPS, auto-restart, updating |
| `api_key_management.md` | How to generate, rotate, and secure all API keys |
| `whatsapp_setup.md` | Meta developer app setup, webhook registration, permanent tokens |
| `crm_setup.md` | HubSpot Private App token, Zoho OAuth2 + refresh token generation |
| `appointment_booking_setup.md` | Google Calendar OAuth2, n8n 24h reminder workflow |
| `multitenant_setup.md` | Self-service registration, per-tenant config, suspend/activate, tiers, team management |
| `client_onboarding.md` | Full checklist for onboarding a new client end-to-end |
| `new_client_setup.md` | Quick-start: creating a client record manually via API |
| `n8n_workflow_setup.md` | Importing and activating n8n workflow templates |

---

## Development Priorities (Updated)

| Priority | Area | Status |
|---|---|---|
| 1 | Backend foundation (FastAPI, Docker, PostgreSQL, health checks) | ✅ Done |
| 2 | AI service layer (Claude, OpenAI, Gemini router) | ✅ Done |
| 3 | Client & subscription management | ✅ Done |
| 4 | Authentication system (JWT, roles, admin seed) | ✅ Done |
| 5 | WhatsApp Cloud API integration + AI triage | ✅ Done |
| 6 | WhatsApp conversations dashboard | ✅ Done |
| 7 | CRM integrations (Internal + HubSpot + Zoho) | ✅ Done |
| 8 | Appointment booking system (Google Calendar sync) | ✅ Done |
| 9 | SaaS multi-tenant layer (self-service, per-tenant config) | ✅ Done |
| 10 | n8n workflow automation (CRM lead, appointment reminder) | ✅ Done |
| 11 | Database migrations (Alembic, 6 migrations) | ✅ Done |
| 12 | Admin dashboard (full SPA with all tabs) | ✅ Done |
| 13 | Nexora landing page (marketing site) | ✅ Done |
| 14 | Login + Register pages | ✅ Done |
| 15 | Frontend deployed to Vercel (`NEXT_PUBLIC_API_URL` env var) | ✅ Done |
| 16 | Production backend deployment (home server, Docker, deploy.sh) | ✅ Done |
| 17 | Cloudflare Tunnel / Nginx internet exposure setup | ✅ Done |
| 18 | n8n production workflows imported + Published | ✅ Done |
| 19 | WhatsApp Meta app + webhook configured | ✅ Done (app awaiting Meta verification) |
| 20 | Self-service tenant signup tested end-to-end | ✅ Done |
| 21 | Landing page — Plumbers + Real Estate verticals added | ✅ Done |
| 22 | Cousin Punjab outreach script (Punjabi + Hindi + Roman) | ✅ Done — sops/cousin_outreach_script.md |
| 23 | AI Calling Agent (Vapi) — Business plan tier | ✅ Done |
| 24 | Billing / Stripe payment integration | 🔜 Planned |
| 25 | Email notifications (appointment confirmations) | 🔜 Planned |
| 26 | Multi-language AI replies (Hindi/Punjabi) | 🔜 Planned |
| 27 | Mobile app (React Native) | 🔜 Planned |
| 28 | Analytics dashboard (usage trends, conversation insights) | 🔜 Planned |
| 29 | White-label / custom domain per tenant | 🔜 Planned |

---

## Deployment Architecture

### Environments

| Environment | Frontend | Backend | Database | n8n |
|---|---|---|---|---|
| **Local dev** | `npm run dev` (localhost:3000) | `docker/docker-compose.yml` (localhost:8000) | Docker container (localhost:5432) | Docker container (localhost:5678) |
| **Production** | Vercel (auto-deploy on push to main) | `docker-compose.prod.yml` on home server | Docker container (internal only) | Docker container (home server:5678) |

### How Dev and Prod Docker Compose Differ

| | `docker/docker-compose.yml` (dev) | `docker-compose.prod.yml` (prod) |
|---|---|---|
| Backend command | `uvicorn ... --reload` | `uvicorn ... --workers 2` (from Dockerfile) |
| Source code | Volume-mounted (live reload) | Built into image (no mount) |
| Postgres port | Exposed on 5432 | Internal only (not exposed) |
| Backend healthcheck | No | Yes — `GET /health` every 30s |
| DB credentials | `user / password` (dev) | `nexora / ${DB_PASSWORD}` from .env |

### Deployment Flow

```
Developer pushes to GitHub (main)
      │
      ├── Vercel detects push → auto-builds + deploys frontend
      │
      └── On the home server:
            bash deploy.sh
              → git pull origin main
              → docker compose build backend
              → docker compose up -d
              → health check
```

### Public URL Structure (Production)

| Service | Public URL | Exposed via |
|---|---|---|
| Frontend (Nexora site) | `https://hap-dev.vercel.app` (or custom domain) | Vercel |
| Backend API | `https://api.yourdomain.com` | Cloudflare Tunnel → localhost:8000 |
| n8n dashboard | `https://n8n.yourdomain.com` | Cloudflare Tunnel → localhost:5678 |

### Updating Production

```bash
# SSH into the home server, then:
cd ~/nexora
bash deploy.sh
```

The script handles everything: pull → build → restart → verify.

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
Every major feature includes a SOP in `sops/` covering:
- What it does
- How to set it up (step by step)
- How to troubleshoot it

### 4. AI-Readable Codebase
- Consistent naming conventions
- Clear folder responsibilities
- CLAUDE.md always kept up to date
- Inline comments only for non-obvious logic

### 5. Reusability First
- Every automation is a reusable module
- Every client setup follows a template
- Every SOP is written so someone new can follow it

### 6. Beginner-Friendly
- The India operator must be able to follow every SOP independently
- Avoid clever/obscure code
- Prefer readable over terse

### 7. Tenant Safety
- Tenant admins can never access another tenant's data — enforced at the dependency level
  via `get_tenant_scope`, not at the route level
- Platform admins (tenant_id = null) have full access
- API key auth (x-api-key) is treated as platform-scope for backward compat with n8n

---

## Long-Term Goal
We are building:
- A production SaaS product (Nexora) for WhatsApp AI automation
- A scalable multi-tenant infrastructure
- A reusable automation ecosystem per industry vertical
- An AI operations platform that the India operator can deploy to clients independently

Think like a long-term technical partner, not a one-shot code generator.
