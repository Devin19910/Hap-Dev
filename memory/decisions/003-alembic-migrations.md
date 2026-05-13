---
name: 003-alembic-migrations
type: decision
date: 2026-05-13
status: Accepted
---

# ADR 003 — Alembic for Database Migrations

## Decision
Use Alembic as the database migration tool alongside SQLAlchemy.

## Reasoning
- Standard tool for SQLAlchemy projects
- Tracks schema changes as versioned migration files
- Safe to run in production — won't destroy data
- Migration files are committed to git (`database/migrations/`)

## How to Apply
- Never change the DB schema by editing models only — always generate a migration
- Run `alembic revision --autogenerate -m "description"` after model changes
- Run `alembic upgrade head` to apply migrations
- All migration files go in `database/migrations/versions/`
