# SOP: Full New Client Setup (End-to-End)

**Who does this:** Operator (India)
**Time required:** ~15 minutes
**When:** Every time a new paying client signs up

## Step 1 — Gather Client Information

Collect from the client:
- [ ] Business name
- [ ] Contact email
- [ ] Chosen plan (Free / Basic / Pro)
- [ ] Business type (salon, clinic, gym, immigration, etc.)
- [ ] WhatsApp number (if using WhatsApp AI)

## Step 2 — Create the Tenant Account

### Option A — Client registers themselves (recommended)
Send the client to:
```
https://your-vercel-frontend-url/register
```
They fill in business name, type, email, and password. Done — account is live immediately with a Free tier subscription.

### Option B — You create it manually (as platform admin)
1. Open the dashboard: `https://your-vercel-frontend-url/login`
2. Log in with your platform admin email and password
3. Go to **Clients** tab → click **Create Client**
4. Fill in Name, Email, Business Type, and Tier
5. Click **Create** — the system generates an API key for them automatically

## Step 3 — Configure Their Integrations

After the account is created, go to **Tenants** tab → select the client → configure:

- **WhatsApp** — their Meta Phone Number ID, Access Token, and Verify Token
  (see `sops/whatsapp_setup.md`)
- **HubSpot** — their Private App token (see `sops/crm_setup.md`)
- **Zoho CRM** — their OAuth2 credentials (see `sops/crm_setup.md`)
- **Google Calendar** — their OAuth2 credentials (see `sops/appointment_booking_setup.md`)

## Step 4 — Set Up Their Automation (if applicable)

1. Verify the n8n workflows are active (see `sops/n8n_workflow_setup.md`)
2. Send a test WhatsApp message to the client's number
3. Confirm: contact appears in CRM, conversation in WhatsApp tab, AI replied correctly

## Step 5 — Verify Everything

- [ ] Client appears in Tenants tab
- [ ] Subscription tier is correct (Free/Basic/Pro)
- [ ] WhatsApp webhook is registered and verified with Meta
- [ ] Test message received + AI replied
- [ ] Contact appeared in CRM (Contacts tab)
- [ ] Google Calendar sync tested (if applicable)

## Troubleshooting

- "Email already registered" → client exists — search in Tenants tab first
- Webhook not triggering → confirm WhatsApp credentials are set in Settings/Tenants tab
- AI not replying → check the backend logs: `docker compose logs backend -f`
- Workflow not triggering → follow `sops/n8n_workflow_setup.md` troubleshooting section
