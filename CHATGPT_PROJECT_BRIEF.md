# Nexora — Full Project Brief for ChatGPT
### Context document: what we built, every decision made, current status, and what's next

---

## WHO WE ARE

**Devinder (Dev)** — Owner and architect, based in the US. Handles infrastructure, API decisions, funding, and strategy.

**Cousin (Harpreet)** — Operator based in Punjab, India (Chandigarh/Ludhiana area). Handles client delivery, day-to-day operations, and onboarding new businesses.

**Engineering environment** — Claude Code + Cursor AI. We build everything with AI-assisted coding. No full-time developer on the team yet.

---

## THE ORIGINAL IDEA (from you, ChatGPT)

You helped us identify the business opportunity:

> Local businesses in India and the US — salons, clinics, gyms, immigration consultants, restaurants — all miss WhatsApp messages, lose leads, and forget to follow up. They can't afford a full CRM team. If we could plug an AI assistant into their WhatsApp number that automatically replies to customers, books appointments, captures leads, and syncs to a CRM — we'd have a real product.

From that idea, we decided to build **Nexora**: a SaaS platform where any local business can sign up, connect their WhatsApp number, and have an AI handling their customer messages within 10 minutes.

---

## WHAT WE ARE BUILDING

**Nexora** is a multi-tenant SaaS AI Automation Platform.

Each business (tenant) gets:
- An AI assistant connected to their WhatsApp number
- Automatic replies to customer inquiries (24/7)
- Appointment booking with Google Calendar sync
- Lead capture into CRM (HubSpot, Zoho, internal)
- An admin dashboard to manage everything

We (as platform admins) manage all tenants, see all data, and can onboard clients on their behalf.

**Target markets:**
- India: small service businesses (salons, clinics, gyms, immigration consultants)
- US: same verticals but different pricing/language expectations

**Business model:**
- Free tier: 50 AI replies/month — lets businesses try before they commit
- Basic: $29/month — 500 replies, CRM sync, Google Calendar
- Pro: $99/month — 5,000 replies, custom AI personality, priority support

---

## TECH STACK WE CHOSE AND WHY

| Layer | Technology | Why |
|---|---|---|
| Backend | Python + FastAPI | Fast to build, easy for AI to write, great API docs auto-generated |
| Database | PostgreSQL | Reliable, relational, handles multi-tenant data well |
| ORM | SQLAlchemy + Alembic | Auto-migrations on startup, no manual SQL |
| Auth | JWT (HS256) + bcrypt | Industry standard, stateless, easy to implement |
| AI | Claude (default), OpenAI, Gemini | Three providers routed through one service — switch via config |
| Automation | n8n (self-hosted) | Visual workflow builder, no-code for the cousin operator |
| Frontend | Next.js 16 + Tailwind CSS | React-based, Vercel-ready, fast |
| Hosting (frontend) | Vercel | Free tier, auto-deploys from GitHub on push |
| Hosting (backend) | Spare laptop as home server, Ubuntu 24.04 | Zero cost to start, upgrade to VPS when revenue comes |
| Internet exposure | Cloudflare Tunnel | Free, no port forwarding needed, HTTPS automatically |
| WhatsApp | Meta Cloud API (Graph API v19) | Official API, free for 1,000 conversations/month |
| CRM | HubSpot + Zoho + internal DB | Clients can use any of these, or just the internal one |
| Appointments | Google Calendar API | Most businesses already use Google Calendar |

---

## EVERY DECISION WE MADE DURING BUILDING

These are the exact answers we gave Claude Code when it asked us questions while building each feature:

### Decision 1 — CRM Integrations
**Question:** Which CRMs to integrate and which actions to support?
**Our answer:** All three — HubSpot, Zoho, and internal database. All four actions: auto-capture from WhatsApp, CRUD dashboard for manual management, push AI triage data (intent/urgency/summary), and fire n8n webhook triggers on new leads.

**Why:** Clients in India mostly use Zoho. US clients mostly use HubSpot. Internal DB is always on as a fallback so nothing is ever lost.

---

### Decision 2 — Appointment Booking System
**Question:** Which calendar system and what booking flow?
**Our answer:** Both internal database and Google Calendar sync. AI detects booking intent from WhatsApp messages → creates a pending appointment → the operator confirms it in the dashboard with the exact date/time → the confirmed appointment syncs to Google Calendar automatically.

**Why:** AI shouldn't auto-confirm appointments without a human check. The operator (cousin) reviews and confirms each one. This avoids double-bookings and gives clients control.

---

### Decision 3 — Multi-Tenant SaaS Layer
**Question:** How should tenants register and what can they configure?
**Our answer:** Self-service registration (anyone can sign up at /register without needing us). Per-tenant credentials for WhatsApp, HubSpot, Zoho, Google Calendar, and AI provider. Per-tenant admin login with their own scoped dashboard. Usage-based billing with free/basic/pro tiers enforced per tenant.

**Why:** We want the platform to work without Dev or the cousin needing to manually set up each new client. Clients sign up, configure their own WhatsApp credentials, and go.

---

### Decision 4 — Brand Name
**Question:** What should the platform be called?
**Our answer:** **Nexora**

**Why:** Sounds professional, scalable, not tied to a specific geography or service type. Works for both India and US markets.

---

### Decision 5 — Landing Page Positioning
**Question:** What angle should the landing page lead with?
**Our answer:** "WhatsApp AI assistant for local businesses" — lead with WhatsApp specifically, not "full AI automation platform."

**Why:** WhatsApp is the dominant messaging app in India. "WhatsApp AI" is immediately understandable to a salon owner or clinic manager. "AI automation platform" is too abstract.

---

### Decision 6 — Industries to Feature
**Question:** Which industries to call out on the landing page?
**Our answer:** Salons & Barbershops, Clinics & Dentists, Gyms & Fitness, Immigration Consultants.

**Why:** These are the four industries our cousin can actually sell to in Punjab right now. Trucking and restaurants were left for a later marketing push.

---

### Decision 7 — Pricing CTAs
**Question:** Should pricing buttons go to self-service signup or a contact/book-a-call form?
**Our answer:** Self-service /register — users sign up themselves instantly.

**Why:** We're building a SaaS product, not an agency. We want people to try it without talking to us first. The free tier removes the risk so there's no reason to gatekeep.

---

### Decision 8 — Frontend Deployment
**Question:** Where to deploy the frontend?
**Our answer:** Vercel — connect the GitHub repo, set root directory to `frontend`, done.

**Why:** Free, auto-deploys on every push to GitHub, zero infrastructure to manage.

---

### Decision 9 — Backend Deployment Target
**Question:** Where to deploy the backend?
**Our answer:** The spare laptop as a home server running Ubuntu 24.04.

**Why:** Zero cost. We have a 32GB/1TB laptop doing nothing. When the business generates revenue, we upgrade to a VPS. Cloudflare Tunnel makes the home server publicly accessible without static IP or port forwarding.

---

### Decision 10 — Full Stack on Server
**Question:** What should run on the home server?
**Our answer:** Full stack — Backend (FastAPI) + PostgreSQL + n8n. Everything in Docker Compose.

**Why:** n8n is the automation engine for CRM webhooks and appointment reminders. It needs to run next to the backend so they can communicate on the same Docker network.

---

### Decision 11 — Internet Exposure Method
**Question:** Cloudflare Tunnel vs port forwarding?
**Our answer:** Cloudflare Tunnel as the primary method.

**Why:** Home servers don't have a static IP. Cloudflare Tunnel creates a persistent HTTPS tunnel from the server to Cloudflare's edge — no router config, no dynamic DNS, HTTPS automatically included. Free.

---

## WHAT HAS BEEN FULLY BUILT (COMPLETE FEATURE LIST)

### Backend (FastAPI + PostgreSQL)

| Feature | What it does | Key files |
|---|---|---|
| Foundation | FastAPI, CORS, Docker Compose, health check | `backend/app/main.py` |
| AI Router | Routes to Claude/OpenAI/Gemini via config | `services/ai_router.py` |
| Auth System | JWT login, bcrypt passwords, platform vs tenant roles | `api/auth.py`, `utils/auth.py` |
| Client Management | CRUD for tenants/clients, API keys | `api/clients.py`, `models/client.py` |
| Subscriptions | Free/basic/pro tiers, usage tracking, upgrade/reset | `api/subscriptions.py` |
| WhatsApp Integration | Receive + send messages via Meta Cloud API | `services/whatsapp_service.py` |
| AI Triage | Classifies intent/urgency, generates reply, extracts booking/service info | `api/webhooks.py` |
| Conversations | Stores all WhatsApp message history per tenant | `api/conversations.py` |
| CRM — Internal | Every WhatsApp contact saved as lead | `services/crm_service.py` |
| CRM — HubSpot | Sync contacts to HubSpot via Private App token | `services/hubspot_service.py` |
| CRM — Zoho | Sync leads to Zoho via OAuth2 refresh token | `services/zoho_service.py` |
| Appointments | Detect booking intent → pending → confirm → Google Calendar | `services/appointment_service.py` |
| Google Calendar | Create/update/delete events via OAuth2 | `services/google_calendar_service.py` |
| Multi-tenancy | Self-service register, per-tenant credentials, data isolation | `api/tenants.py`, `utils/tenant_config.py` |
| Database Migrations | 6 Alembic migrations, auto-run on startup | `alembic/versions/` |

### Frontend (Next.js + Tailwind)

| Page | What it does |
|---|---|
| `/` | Nexora marketing landing page (hero, how it works, industries, pricing, footer) |
| `/login` | Email + password login → JWT stored in localStorage → redirect to dashboard |
| `/register` | Self-service signup → creates tenant + auto-login → dashboard |
| `/dashboard` | Full admin SPA with 9 tabs (see below) |

**Dashboard tabs:**

| Tab | Visible to | What it does |
|---|---|---|
| Overview | Everyone | Stats: clients, AI jobs, token usage, recent conversations |
| Clients | Platform admin only | Create/view/delete clients, subscription details, upgrade tiers |
| Jobs | Everyone | All AI completions — prompt, response, tokens used |
| WhatsApp | Everyone | All conversations, message history, intent/urgency badges |
| Contacts | Everyone | CRM contacts table, search/filter, edit, sync to HubSpot/Zoho |
| Appointments | Everyone | Pending/confirmed list, confirm with date+time, Calendar sync status |
| Settings | Tenant admins | Update their WhatsApp, HubSpot, Zoho, Google Calendar, AI provider |
| Tenants | Platform admin only | Browse all tenants, see integration status, suspend/activate |
| Team | Platform owner only | Create/list platform admin users |

### n8n Workflows (Automation)

| Workflow file | What it does |
|---|---|
| `crm_new_lead_workflow.json` | Fires when a new contact is captured from WhatsApp |
| `appointment_reminder_workflow.json` | Waits 24h after booking confirmed → sends WhatsApp reminder |
| `ai_triage_workflow.json` | AI triage pipeline (alternative to built-in backend triage) |

### Deployment Setup

| File | What it does |
|---|---|
| `docker/docker-compose.yml` | Local dev stack with hot-reload |
| `docker-compose.prod.yml` | Production stack (built image, internal Postgres, healthchecks) |
| `nginx/nginx.conf` | Reverse proxy for api.domain + n8n.domain with HTTPS + WebSocket |
| `deploy.sh` | One-command update script: git pull → build → restart → health check |

### SOPs Written (Standard Operating Procedures)

All in `/sops/` — written so the India operator can follow them independently without needing Dev.

| SOP | Covers |
|---|---|
| `deployment_process.md` | Docker Compose, Vercel deploy |
| `server_deployment.md` | Full home server setup (Ubuntu, Docker, Cloudflare Tunnel, HTTPS) |
| `whatsapp_setup.md` | Meta developer app, webhook registration |
| `crm_setup.md` | HubSpot + Zoho credentials |
| `appointment_booking_setup.md` | Google Calendar OAuth2, n8n reminder workflow |
| `multitenant_setup.md` | Tenant registration, config, suspend/activate, tiers |
| `client_onboarding.md` | Full checklist for onboarding a new client |
| `new_client_setup.md` | Creating a client manually via API |
| `n8n_workflow_setup.md` | Importing and activating n8n workflow templates |
| `api_key_management.md` | Generating, rotating, securing all API keys |

---

## DATABASE SCHEMA (What's in PostgreSQL)

| Table | What it stores |
|---|---|
| `clients` | Every tenant — name, email, slug, WhatsApp/HubSpot/Zoho/Google credentials (per-tenant) |
| `admin_users` | Platform admins + tenant admins; `tenant_id = null` means platform admin |
| `subscriptions` | tier (free/basic/pro), monthly limit, usage count per tenant |
| `automation_jobs` | Every AI completion — prompt, response, tokens, provider, client |
| `whatsapp_conversations` | One row per phone number per client — last message, intent, count |
| `contacts` | Every WhatsApp contact captured as a lead — intent, urgency, CRM IDs |
| `appointments` | Every booking — status, scheduled time, Google Calendar event ID |

---

## CURRENT STATE (As of May 2026)

### What is live and running
- ✅ Local backend running at http://localhost:8000 (Docker Compose dev stack)
- ✅ Production backend running on home server at 172.30.25.69:8000 (Docker Compose prod stack)
- ✅ Production n8n running at 172.30.25.69:5678
- ✅ Production PostgreSQL running (internal only)
- ✅ All 3 containers healthy on production server (nexora-backend, nexora-postgres, nexora-n8n)
- ✅ Cloudflare Tunnel live — backend at https://nexora.cmdfleet.com, n8n at https://nexora-n8n.cmdfleet.com
- ✅ Vercel frontend NEXT_PUBLIC_API_URL updated — live site talks to production backend
- ✅ End-to-end login verified: https://hap-dev.vercel.app works with production backend
- ✅ n8n running at http://localhost:5678 — all 3 workflows imported and active (local dev)
- ✅ All API keys set (Claude, OpenAI, Gemini)
- ✅ Admin account: sodhi.398@gmail.com / Changeme123!
- ✅ Code pushed to GitHub: github.com/Devin19910/Hap-Dev
- ✅ Frontend live on Vercel: https://hap-dev.vercel.app (auto-deploys on every push to main)

### What still needs to be done manually
- ❌ WhatsApp Meta developer app not created yet
- ❌ Register first real client / test tenant end-to-end

---

## WHAT'S PLANNED NEXT (In Priority Order)

| Priority | Feature | Why |
|---|---|---|
| 1 | Stripe billing integration | Automate plan upgrades — currently done manually via SQL |
| 2 | Email notifications | Send appointment confirmations by email, not just WhatsApp |
| 3 | Hindi/Punjabi AI replies | India clients' customers message in Hindi — AI should reply in same language |
| 4 | Analytics dashboard | Show usage trends, conversation volume, booking conversion rates |
| 5 | Mobile app (React Native) | Cousin needs mobile access to dashboard on the go |
| 6 | White-label / custom domain | Let agencies resell Nexora under their own brand |

---

## KEY ARCHITECTURAL DECISIONS WORTH KNOWING

**1. Per-tenant credentials with global fallback**
Every service (WhatsApp, HubSpot, Zoho, Google Calendar, AI provider) checks for a tenant-specific credential first. If none is set, it falls back to the global `.env` value. This means one server can serve hundreds of tenants each with their own WhatsApp number, while the platform admin only needs to set up global defaults for testing.

**2. Two levels of admin**
- `tenant_id = null` in `admin_users` table = platform admin (sees everything)
- `tenant_id = <client.id>` = tenant admin (sees only their own data)
This is enforced at the dependency level (`get_tenant_scope`) so there's no risk of a tenant accidentally seeing another tenant's data.

**3. n8n for complex workflows, backend for real-time**
The backend handles real-time WhatsApp message processing (receive → triage → reply → save contact → create appointment). n8n handles the async workflows that happen after (CRM notifications, 24h reminders). They communicate via HTTP webhooks.

**4. Alembic auto-migration on startup**
The backend runs `alembic upgrade head` every time it starts. This means deploying an update never requires a separate migration step — just `bash deploy.sh` and the database is updated automatically.

**5. JWT stored in localStorage (not httpOnly cookie)**
Simple implementation for now. Acceptable for an admin dashboard used by the business owner. For a public consumer product, we'd move to httpOnly cookies for better XSS protection.

---

## HOW TO HELP US (What to Ask ChatGPT)

Now that you have full context, here are things you can help with:

- **Stripe integration** — how to add subscription billing with Stripe Checkout for the free → basic → pro upgrade flow
- **Email notifications** — adding SendGrid or Resend for appointment confirmation emails
- **Hindi/Punjabi AI** — how to detect message language and reply in the same language using Claude
- **Analytics** — what metrics to track and how to build a simple analytics tab in the dashboard
- **Mobile app** — best approach for a React Native app that reuses the same backend API
- **Scaling** — when and how to move from the home server to a proper cloud VPS
- **Marketing** — how to get the first 10 paying clients in Punjab for the cousin to deliver to

---

## GITHUB REPOSITORY

`https://github.com/Devin19910/Hap-Dev`

Everything is in this repo. The main branch is always the latest working code.
The `CLAUDE.md` file at the root is the master engineering reference for the codebase.
The `MANUAL_SETUP_GUIDE.md` file tracks every manual task Dev needs to do.
The `sops/` folder has step-by-step guides for every integration.
