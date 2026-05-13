from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models.base import init_db
from .api import health, ai, clients, subscriptions

app = FastAPI(
    title="AI Automation Company API",
    description="Multi-provider AI automation platform — OpenAI, Claude, Gemini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ai.router)
app.include_router(clients.router)
app.include_router(subscriptions.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "AI Automation API running", "docs": "/docs"}
