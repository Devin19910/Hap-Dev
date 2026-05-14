# SOP: Client Onboarding

**Who does this:** India operator
**When:** Every time a new paying client signs up

## Steps

1. Collect client name, email, business type, and chosen plan (free / basic / pro)
2. Have the client self-register at `/register` — OR — create the account manually:
   - Open the dashboard at your deployment URL and log in with your platform admin email + password
   - Go to **Clients** tab → **Create Client**
3. Set up their integrations from the **Tenants** tab (WhatsApp, HubSpot/Zoho, Google Calendar)
4. Send a test WhatsApp message to verify the AI is responding
5. Confirm contact appears in the CRM (**Contacts** tab)

For the full step-by-step guide, see `sops/new_client_setup.md`.

## Troubleshooting
- "Email already registered" → check Tenants tab first; client may already exist
- "Invalid tier" → only use: free, basic, pro (all lowercase)
- AI not responding → check backend logs: `docker compose logs backend -f`

## Notes
- Never share the internal `API_SECRET_KEY` with clients — they get their own scoped API key
- Free tier is 50 requests/month; upgrade via the Clients tab if they ask for more
