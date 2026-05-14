# Webhook System

All incoming webhooks are handled by the FastAPI backend at `/webhooks/*`.

## Active Endpoints

| Endpoint | Method | Source | Purpose |
|---|---|---|---|
| `/webhooks/whatsapp` | GET + POST | Meta | Global WhatsApp webhook (uses .env credentials) |
| `/webhooks/whatsapp/{tenant_id}` | GET + POST | Meta | Per-tenant WhatsApp webhook |
| `/webhooks/n8n/trigger` | POST | n8n | Manual trigger from n8n workflows |

## Security

All webhook endpoints verify a shared secret. Set `WEBHOOK_SECRET` in `.env`.

Meta webhooks: Meta sends a signature in `X-Hub-Signature-256` — the backend verifies it
against `WEBHOOK_SECRET`.

n8n webhooks: pass `x-api-key: <API_SECRET_KEY>` header.

## WhatsApp Webhook Flow

When Meta sends a message to `/webhooks/whatsapp/{tenant_id}`:

1. Signature verified
2. Message body + sender phone extracted
3. WhatsApp conversation record upserted
4. AI triage runs (intent, urgency, suggested reply)
5. AI reply sent back via WhatsApp
6. CRM contact upserted (with intent/urgency/summary)
7. If intent = "booking" → pending Appointment created
8. n8n CRM webhook fired (background task)

## Adding a New Webhook

1. Add route in `backend/app/api/webhooks.py`
2. Add handler logic in a service file under `backend/app/services/`
3. Add `WEBHOOK_SECRET` validation
4. Document here
