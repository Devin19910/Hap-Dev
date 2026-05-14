# n8n Workflow Automation

n8n is our self-hosted workflow automation tool. It runs as a Docker service alongside the backend.

## Access

- Local: http://localhost:5678
- Credentials: set via `N8N_USER` and `N8N_PASSWORD` in `.env`

## Workflow Templates

All workflow JSON files in this folder are the canonical templates. To import into n8n:

1. Open n8n at http://localhost:5678
2. Log in
3. Click **+** (New Workflow) → **...** → **Import from file**
4. Select the JSON file from this folder
5. Review, then click the **Active** toggle to enable it

## Available Workflow Templates

| File | What it does | Webhook path |
|---|---|---|
| `crm_new_lead_workflow.json` | Fires when a new WhatsApp contact is captured; extracts name/phone/intent | `/webhook/crm-new-lead` |
| `appointment_reminder_workflow.json` | Waits 24h after appointment confirmed, then fires reminder | `/webhook/appointment-confirmed` |
| `ai_triage_workflow.json` | Receives message, calls backend AI, routes by intent | `/webhook/ai-triage` |

## Connecting to the Backend

n8n calls our FastAPI backend over the internal Docker network:

```
http://backend:8000
```

Do NOT use `http://localhost:8000` — that resolves to the n8n container itself, not the backend.

Auth header for backend API calls:
```
x-api-key: <value of API_SECRET_KEY in .env>
```

## Webhook URLs (for n8n → backend calls)

| Purpose | URL |
|---|---|
| New lead notification | `http://n8n:5678/webhook/crm-new-lead` |
| Appointment reminder timer | `http://n8n:5678/webhook/appointment-confirmed` |

These are set as `N8N_NEW_LEAD_WEBHOOK` and `N8N_APPOINTMENT_WEBHOOK` in `.env`.

## Troubleshooting

- **n8n not starting** → check `N8N_USER` and `N8N_PASSWORD` are set in `.env`
- **Can't reach backend from n8n** → use `http://backend:8000`, not `localhost`
- **Workflow not triggering** → confirm the workflow is toggled Active
- **500 error on webhook** → check `responseMode` is `onReceived` (not `lastNode`) on the Webhook node
- **Auth error on backend call** → confirm `x-api-key` matches `API_SECRET_KEY` in `.env`
