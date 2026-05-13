# Third-Party Integrations

## Planned Integrations

### WhatsApp Business API
- Provider: Meta (via Twilio or direct)
- Use: AI-powered customer support, appointment booking, lead handling
- Webhook: `POST /webhooks/whatsapp/message`
- Setup guide: `docs/setup/whatsapp_setup.md`

### Calendly / Cal.com
- Use: Appointment booking automation
- Webhook: `POST /webhooks/calendly/booking`

### Stripe
- Use: Subscription billing for SaaS clients
- Webhook: `POST /webhooks/stripe/payment`

### Google Sheets / Drive
- Use: Client data export, report generation

### Twilio SMS
- Use: SMS notifications, OTP, alerts

### Notion API
- Use: SOP management, client project tracking

## How to Add an Integration
1. Add the API client to `backend/app/services/`
2. Add credentials to `.env` and `.env.example`
3. Add webhook handler if needed
4. Write a setup doc in `docs/setup/`
5. Write an SOP in `sops/`
