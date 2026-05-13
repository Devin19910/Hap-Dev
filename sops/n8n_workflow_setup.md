# SOP: Setting Up an n8n Workflow

**Who does this:** Owner or Operator  
**When:** Adding a new automation for a client

## Prerequisites
- Docker Compose is running (`docker compose up -d`)
- n8n is accessible at http://localhost:5678

## Steps

1. Open n8n at **http://localhost:5678**
2. Log in with `N8N_USER` / `N8N_PASSWORD` from your `.env`
3. Click **+ New Workflow**
4. Build your workflow:
   - Use **Webhook** node as the trigger (for inbound events)
   - Use **HTTP Request** node to call our backend: `http://backend:8000/ai/complete`
   - Set `x-api-key` header to your `API_SECRET_KEY`
5. Test the workflow using the **Execute Workflow** button
6. Once working, click **Active** toggle to enable it
7. Export the workflow: **⋮ menu → Download** → save JSON to `automation/n8n/`
8. Commit the JSON file to git

## Connecting to the Backend
When calling our API from inside n8n (Docker network), use:
```
http://backend:8000
```
NOT `http://localhost:8000` — that won't work inside Docker.

## Troubleshooting
- **Workflow not triggering** → check the webhook URL is correct and workflow is Active
- **Can't reach backend** → use `http://backend:8000`, not `localhost`
- **Auth error** → make sure `x-api-key` header matches `API_SECRET_KEY` in `.env`
- **n8n won't start** → check `N8N_USER` and `N8N_PASSWORD` are set in `.env`
