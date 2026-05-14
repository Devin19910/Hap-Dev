# Nexora — WhatsApp AI for Local Businesses

**Nexora** is a multi-tenant SaaS AI Automation Platform. Each business gets an AI assistant
connected to their WhatsApp number — handling inquiries, booking appointments, capturing leads,
and syncing to CRM and Google Calendar automatically.

**GitHub:** [Devin19910/Hap-Dev](https://github.com/Devin19910/Hap-Dev)

---

## What's Built

| Layer | Technology | Status |
|---|---|---|
| Backend API | FastAPI + PostgreSQL + SQLAlchemy | ✅ Running |
| Frontend | Next.js 16 + Tailwind CSS | ✅ Running |
| Automation | n8n (self-hosted) | ✅ Running |
| AI | Claude (default) / OpenAI / Gemini | ✅ Configured |
| Auth | JWT + bcrypt, multi-role | ✅ Done |
| WhatsApp | Meta Cloud API (Graph v19) | ✅ Done |
| CRM | Internal + HubSpot + Zoho | ✅ Done |
| Appointments | Google Calendar sync | ✅ Done |
| Multi-tenancy | Self-service registration, per-tenant config | ✅ Done |

## Quick Start (Local Dev)

```bash
# 1. Start backend + database + n8n
cd docker && docker compose up -d

# 2. Start frontend
cd frontend && npm run dev
```

- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- n8n dashboard: http://localhost:5678
- Frontend: http://localhost:3000

## Folder Structure

```
backend/        FastAPI app — routes, services, models, utils
frontend/       Next.js app — landing page, login, register, dashboard
automation/     n8n workflow templates + integration docs
sops/           Step-by-step guides for every operation (written for the India operator)
docs/           Architecture decisions and setup references
docker/         Local dev Docker Compose stack
nginx/          Reverse proxy config (used for home server deployment)
prompts/        Reusable AI prompt templates
memory/         Architecture decision records and lessons learned
```

## Deployment

| Environment | How |
|---|---|
| **Local dev** | `docker/docker-compose.yml` (hot reload) |
| **Production backend** | `docker-compose.prod.yml` on spare Ubuntu laptop |
| **Production frontend** | Vercel (auto-deploy from GitHub main) |
| **Internet exposure** | Cloudflare Tunnel (no port forwarding, free HTTPS) |

See `sops/server_deployment.md` for the full production setup guide.

## Documentation

| File | What it covers |
|---|---|
| `CLAUDE.md` | Master engineering reference — full feature inventory, models, APIs |
| `MANUAL_SETUP_GUIDE.md` | Manual task checklist for things that can't be scripted |
| `sops/` | Operating procedures for every integration and deployment step |
| `CHATGPT_PROJECT_BRIEF.md` | Full project brief for AI context handoff |
