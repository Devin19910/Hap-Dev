# SOP: CRM Integration Setup

## What This Does
Automatically captures every WhatsApp contact as a lead in:
1. **Internal database** (always on — no setup required)
2. **HubSpot** (optional — requires a free HubSpot account)
3. **Zoho CRM** (optional — requires a Zoho CRM account)

When a WhatsApp message comes in, the AI triage runs, a reply is sent, and the contact is saved with their intent, urgency, and AI summary. New contacts are also sent to n8n for custom follow-up workflows.

Contacts can also be created and managed manually from the admin dashboard.

---

## Part 1 — Internal CRM (No Setup Needed)

The internal contacts database works automatically once the backend is deployed. Every WhatsApp message from a new number creates a contact record.

To view contacts:
```bash
curl -H "Authorization: Bearer YOUR_JWT" http://localhost:8000/contacts
```

Or open the **Contacts** tab in the admin dashboard.

---

## Part 2 — HubSpot Setup

### 2.1 Create a HubSpot Private App

1. Log in at [app.hubspot.com](https://app.hubspot.com)
2. Go to **Settings → Integrations → Private Apps**
3. Click **Create a private app**
4. Name it (e.g. "AI Platform Integration")
5. Under **Scopes**, add:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
6. Click **Create app** → copy the **Access Token**

### 2.2 Configure .env

```env
HUBSPOT_API_KEY=pat-eu1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Restart the backend:
```bash
docker compose up -d --force-recreate backend
```

### 2.3 Verify

Create or receive a WhatsApp contact, then check HubSpot Contacts — the entry should appear within a few seconds.

---

## Part 3 — Zoho CRM Setup

### 3.1 Register an API Client

1. Go to [api-console.zoho.com](https://api-console.zoho.com)
2. Click **Add Client → Server-based Applications**
3. Fill in:
   - **Client Name**: AI Platform
   - **Homepage URL**: your domain or `http://localhost`
   - **Authorized Redirect URIs**: `https://www.zoho.com/crm` (or your domain)
4. Note the **Client ID** and **Client Secret**

### 3.2 Generate a Refresh Token

Run this URL in a browser (replace placeholders):
```
https://accounts.zoho.com/oauth/v2/auth
  ?scope=ZohoCRM.modules.leads.ALL,ZohoCRM.modules.contacts.ALL
  &client_id=YOUR_CLIENT_ID
  &response_type=code
  &access_type=offline
  &redirect_uri=https://www.zoho.com/crm
```

After approving, you'll be redirected with a `code=` parameter. Exchange it for a refresh token:
```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "code=THE_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://www.zoho.com/crm" \
  -d "grant_type=authorization_code"
```

Copy the `refresh_token` from the response — it does not expire.

### 3.3 Configure .env

```env
ZOHO_CLIENT_ID=1000.xxxxxxxxxxxxxx
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxx.xxxxxxxxxxxxxx
```

Restart the backend:
```bash
docker compose up -d --force-recreate backend
```

### 3.4 Verify

Receive a WhatsApp message, then check **Zoho CRM → Leads** — the lead should appear within a few seconds with the AI triage in the Description field.

---

## Part 4 — n8n New Lead Workflow

### 4.1 Import the Workflow

1. Open n8n at `http://localhost:5678`
2. Go to **Workflows → New → Import from file**
3. Upload `automation/n8n/crm_new_lead_workflow.json`
4. Activate the workflow

### 4.2 Get the Webhook URL

1. Open the imported workflow
2. Click the **Webhook** node
3. Copy the **Production URL** (looks like `http://n8n:5678/webhook/crm-new-lead`)

### 4.3 Configure .env

```env
N8N_NEW_LEAD_WEBHOOK=http://n8n:5678/webhook/crm-new-lead
```

Restart the backend:
```bash
docker compose up -d --force-recreate backend
```

### 4.4 Extend the Workflow

The workflow currently receives the lead data and responds 200. After the **Extract Lead Data** node, add your own follow-up actions:
- **Send Slack/WhatsApp notification** to the operator
- **Create a task** in Zoho/HubSpot
- **Add to email sequence** via Mailchimp/Brevo
- **Book appointment** via Google Calendar

The payload the workflow receives:
```json
{
  "event": "new_lead",
  "contact_id": "uuid",
  "client_id": "uuid",
  "phone": "+919876543210",
  "email": "",
  "name": "Gurpreet Singh",
  "source": "whatsapp",
  "intent": "booking",
  "urgency": "high",
  "summary": "Customer wants to book a haircut appointment for tomorrow"
}
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Contacts not appearing in HubSpot | Check `HUBSPOT_API_KEY` is set. Check Docker logs: `docker compose logs backend` |
| Zoho token refresh fails | Refresh token may be expired — regenerate using Step 3.2 above |
| Zoho 403 error | Scope not granted — re-run the authorization URL with correct scopes |
| n8n webhook times out | Check that `N8N_NEW_LEAD_WEBHOOK` uses the internal Docker hostname (`n8n:5678`), not `localhost` |
| Duplicate contacts in HubSpot | The service searches by phone number first — ensure phone numbers include country code (e.g. `+91...`) |
| Contact shows no CRM IDs in dashboard | Check backend logs for `[hubspot]` or `[zoho]` errors |

---

## Related Files

| File | Purpose |
|---|---|
| `backend/app/models/contact.py` | Internal contacts DB model |
| `backend/app/services/crm_service.py` | Orchestrates all CRM syncs |
| `backend/app/services/hubspot_service.py` | HubSpot API calls |
| `backend/app/services/zoho_service.py` | Zoho CRM API calls |
| `backend/app/api/contacts.py` | REST API for contacts CRUD |
| `automation/n8n/crm_new_lead_workflow.json` | n8n workflow template |
