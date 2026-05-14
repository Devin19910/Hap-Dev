# Third-Party Integrations

## Built and Active

### WhatsApp Cloud API (Meta)
- Receive and send messages via Meta Graph API v19.0
- Global webhook: `GET/POST /webhooks/whatsapp`
- Per-tenant webhook: `GET/POST /webhooks/whatsapp/{tenant_id}`
- Setup guide: `sops/whatsapp_setup.md`

### HubSpot CRM
- Sync contacts via Private App token
- Triggered automatically when a new WhatsApp contact is captured
- Per-tenant credential in Settings tab; falls back to global `HUBSPOT_API_KEY`
- Setup guide: `sops/crm_setup.md`

### Zoho CRM
- Sync leads via OAuth2 refresh token
- Triggered automatically when a new WhatsApp contact is captured
- Per-tenant credential in Settings tab; falls back to global `ZOHO_*` env vars
- Setup guide: `sops/crm_setup.md`

### Google Calendar
- Create/update/delete events on appointment confirmation
- Per-tenant credential in Settings tab; falls back to global `GOOGLE_*` env vars
- Setup guide: `sops/appointment_booking_setup.md`

### n8n (self-hosted)
- CRM new lead webhook: `http://n8n:5678/webhook/crm-new-lead`
- Appointment reminder webhook: `http://n8n:5678/webhook/appointment-confirmed`
- Setup guide: `sops/n8n_workflow_setup.md`

---

## Planned

| Integration | Use case |
|---|---|
| Stripe | Subscription billing — automate Free → Basic → Pro upgrades |
| SendGrid / Resend | Appointment confirmation emails |
| React Native app | Mobile dashboard for the India operator |
