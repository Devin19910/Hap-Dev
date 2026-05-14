import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
from .api import health, ai, clients, subscriptions, webhooks, auth, conversations, contacts, appointments, tenants, calls, billing
from .models.base import SessionLocal

app = FastAPI(
    title="AI Automation Company API",
    description="Multi-provider AI automation platform — OpenAI, Claude, Gemini + n8n workflows",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(clients.router)
app.include_router(subscriptions.router)
app.include_router(webhooks.router)
app.include_router(conversations.router)
app.include_router(contacts.router)
app.include_router(appointments.router)
app.include_router(tenants.router)
app.include_router(calls.router)
app.include_router(billing.router)


@app.on_event("startup")
def on_startup():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    alembic_cfg = AlembicConfig(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    alembic_command.upgrade(alembic_cfg, "head")

    db = SessionLocal()
    try:
        from .api.auth import seed_admin_if_empty
        seed_admin_if_empty(db)
    finally:
        db.close()


@app.get("/")
async def root():
    return {
        "message": "AI Automation API running",
        "docs": "/docs",
        "version": "1.0.0",
    }
