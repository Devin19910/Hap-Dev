# CLAUDE PROJECT INSTRUCTIONS

## Project Overview
This is an AI automation business template built to generate income from both the US and India markets.
The project is being built by the owner (based in US) in collaboration with a remote operator/cousin
(based in Punjab, India — Chandigarh/Ludhiana area). The goal is to launch a real, scalable online
business that can run semi-independently from India while growing US revenue over time.

## Business Goals
- Build AI-powered automation services that clients pay for (subscriptions, APIs, one-time projects)
- Enable the India-based operator to manage and grow the business independently over time
- Generate US revenue (e.g. SaaS, automation agencies, white-label AI tools) with India as the ops base
- Start lean (low cost), scale smart — use AI tools to multiply output without hiring

## Team & Collaboration
- Owner/Dev: US-based, handles architecture, funding, AI APIs, infrastructure decisions
- Operator/Cousin: India-based (Punjab), handles delivery, client comms, day-to-day execution
- All SOPs (Standard Operating Procedures) must be written so the operator can follow them independently
- Use Notion for SOPs, task tracking, and documentation shared between both

## Tech Stack & Tools
- **AI Tools**: Cursor AI, Claude Code, Claude API, OpenAI API, Gemini API
- **Backend**: Python (FastAPI preferred), Docker, reusable service modules
- **Frontend**: Next.js / React, deployable to Vercel
- **Database**: PostgreSQL or SQLite to start, scalable later
- **Infra**: Windows 11 Pro + WSL2 (dev environment), Docker for local + prod parity
- **Deployment**: Vercel (frontend/serverless), Docker Compose (backend services)
- **PM / Docs**: Notion, SOPs per workflow

## Infrastructure Notes
- Dev machine runs Windows 11 Pro with WSL2 (Ubuntu) — all dev work happens inside WSL
- Docker is being set up; all services must be containerized
- Owner has a spare 32GB RAM / 1TB laptop that can serve as a local server to save cloud costs
- APIs in use: OpenAI, Anthropic (Claude), Google (Gemini) — keys stored in .env, never hardcoded

## Engineering Rules
- Keep code modular — one file per concern, no god files
- No hardcoded secrets — all keys and credentials go in .env files
- Use environment variables for all config (API keys, DB URLs, ports)
- Prefer reusable services — build once, use across multiple automations
- Use Docker for reproducibility — if it runs locally it must run in prod
- Document important decisions in /docs/decisions/
- Write SOPs for every repeatable process in /docs/sops/

## Folder Conventions
```
backend/app/api/        -> API route handlers
backend/app/services/   -> business logic & AI integrations
backend/app/models/     -> DB models (SQLAlchemy or similar)
backend/app/utils/      -> shared helpers and utilities
frontend/               -> Next.js app, deployable to Vercel
docs/sops/              -> Standard Operating Procedures for the operator
docs/decisions/         -> Architecture Decision Records (ADRs)
scripts/                -> setup scripts, automation utilities
```

## AI Workflow Philosophy
- Build reusable automations — every workflow should be a module, not a one-off
- Track architecture decisions — write a short ADR when making a significant tech choice
- Prioritize scalability — design for 10x usage from day one, even if starting at 1x
- Use AI tools to multiply output — Cursor + Claude Code + APIs are force multipliers
- SOPs first — if a human has to do it more than once, write the SOP before automating it

## Deployment Target
- Frontend: Vercel (zero-config for Next.js, easy for the operator to redeploy)
- Backend: Docker Compose on VPS or local server (migrate to cloud when revenue justifies it)
- Keep infra costs near zero at launch — use free tiers and existing hardware first
