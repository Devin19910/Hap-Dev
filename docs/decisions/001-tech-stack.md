# ADR 001 — Tech Stack Selection

**Date:** 2026-05-13  
**Status:** Accepted

## Decision
- Backend: FastAPI (Python) with SQLAlchemy + PostgreSQL
- Frontend: Next.js 14 (React) deployed to Vercel
- AI: Multi-provider via OpenAI, Anthropic Claude, Google Gemini
- Infra: Docker Compose locally, Vercel for frontend

## Reasoning
- FastAPI is fast to develop, async-native, and auto-generates OpenAPI docs
- PostgreSQL is reliable, free on most cloud tiers, and handles subscription/usage data well
- Multi-provider AI means we are not locked to one vendor and can route cheaply
- Vercel gives the India operator a one-click redeploy path for the frontend
- Docker ensures the backend runs identically on the dev laptop, spare server, or any VPS

## Trade-offs
- SQLite would be simpler to start but doesn't scale to multi-user; PostgreSQL is worth the extra setup
- A monorepo (frontend + backend together) keeps things simpler for a small 2-person team
