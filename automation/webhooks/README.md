# Webhook System

All incoming webhooks are handled by the FastAPI backend at `/webhooks/*`.

## Endpoint Pattern
```
POST /webhooks/{source}/{event}
```
Examples:
- `POST /webhooks/whatsapp/message`
- `POST /webhooks/n8n/trigger`
- `POST /webhooks/calendly/booking`
- `POST /webhooks/stripe/payment`

## Security
All webhook endpoints validate a shared secret via `X-Webhook-Secret` header.
Set `WEBHOOK_SECRET` in `.env`.

## Adding a New Webhook
1. Add route in `backend/app/api/webhooks.py`
2. Add handler logic in `backend/app/services/webhook_service.py`
3. Document it here
4. Add SOP in `sops/webhook_setup.md`

## Current Webhooks
| Endpoint | Source | Purpose |
|---|---|---|
| `/webhooks/n8n/trigger` | n8n | Triggers AI automation from n8n workflow |
| `/webhooks/whatsapp/message` | WhatsApp Business API | Incoming WhatsApp messages |
