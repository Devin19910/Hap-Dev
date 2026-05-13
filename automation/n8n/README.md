# n8n Workflow Automation

n8n is our self-hosted workflow automation tool. It runs as a Docker service alongside the backend.

## Access
- Local: http://localhost:5678
- Default credentials: set via `N8N_BASIC_AUTH_USER` and `N8N_BASIC_AUTH_PASSWORD` in `.env`

## Workflow Templates
Store exported n8n workflow JSON files here. To use:
1. Open n8n at http://localhost:5678
2. Go to Workflows → Import from File
3. Select the JSON file from this folder

## Available Workflow Templates
- `lead_capture.json` — captures lead from webhook, enriches with AI, stores in DB
- `appointment_booking.json` — handles booking requests via WhatsApp or form
- `content_generator.json` — scheduled AI content generation pipeline
- `client_daily_report.json` — daily summary email to client via AI

## Connecting to Backend
n8n calls our FastAPI backend via webhooks. Backend webhook base URL:
- Local: http://backend:8000/webhooks
- Production: https://your-domain.com/webhooks

## Troubleshooting
- n8n not starting → check `N8N_BASIC_AUTH_USER` is set in `.env`
- Can't reach backend from n8n → use `http://backend:8000` not `localhost:8000` (Docker networking)
- Workflow not triggering → check the webhook URL matches what's configured in n8n
