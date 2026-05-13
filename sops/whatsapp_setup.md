# SOP: WhatsApp Cloud API Setup (Meta)

## What This Does
Connects your AI backend to WhatsApp via Meta's Cloud API so the platform can receive and reply to customer messages automatically.

---

## Prerequisites
- A Facebook Business account
- A phone number not already registered on WhatsApp (can be a virtual number)
- Your backend running and publicly accessible (or via ngrok for testing)

---

## Step 1 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Select **Business** as the app type
4. Fill in the app name (e.g. "YourBusiness WhatsApp Bot") and contact email
5. Click **Create App**

---

## Step 2 — Add WhatsApp Product

1. On your app dashboard, scroll to **Add Products to Your App**
2. Find **WhatsApp** and click **Set Up**
3. You will be taken to the WhatsApp → Getting Started screen

---

## Step 3 — Get Your Credentials

On the WhatsApp → Getting Started page:

| Field | Where to Find It |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Listed under "From" phone number — click it to see the ID |
| `WHATSAPP_ACCESS_TOKEN` | Temporary token shown on the page — see Step 4 for permanent token |
| `WHATSAPP_VERIFY_TOKEN` | You choose this — any string (e.g. `whatsapp-verify-abc123`) |

---

## Step 4 — Create a Permanent Access Token

The temporary token expires in 24 hours. For production, create a permanent one:

1. Go to **Business Settings → System Users**
2. Create a new System User (role: Admin)
3. Click **Add Assets** → select your WhatsApp app → give **Full Control**
4. Click **Generate New Token** → select your app → check `whatsapp_business_messaging` and `whatsapp_business_management`
5. Copy the token — this is your `WHATSAPP_ACCESS_TOKEN`

---

## Step 5 — Configure Webhook

1. On the WhatsApp → Configuration page, click **Edit** next to Webhook
2. **Callback URL**: `https://yourdomain.com/webhooks/whatsapp`
   - For local testing: use ngrok — `ngrok http 8000` → use the https URL
3. **Verify Token**: enter the same value as your `WHATSAPP_VERIFY_TOKEN` in `.env`
4. Click **Verify and Save**
5. Under **Webhook Fields**, subscribe to **messages**

---

## Step 6 — Update Your .env

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=whatsapp-verify-abc123   # must match what you entered in Meta dashboard
WHATSAPP_CLIENT_ID=<UUID of the client this line belongs to>
WHATSAPP_BUSINESS_NAME=Your Business Name
```

Restart the backend after updating `.env`:
```bash
docker compose up -d --force-recreate backend
```

---

## Step 7 — Test It

### Verify the webhook is connected
```bash
curl "https://yourdomain.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp-verify-abc123&hub.challenge=testchallenge"
# Should return: testchallenge
```

### Send a test message
From your personal WhatsApp, send a message to the test phone number shown in the Meta dashboard. You should receive an AI-generated reply within a few seconds.

### Check conversation logs
```bash
curl -H "x-api-key: YOUR_API_SECRET_KEY" https://yourdomain.com/conversations
```

---

## Step 8 — Go Live (Production)

Meta's test phone number only works for verified test numbers. To message any WhatsApp user:

1. Go to **WhatsApp → Phone Numbers → Add Phone Number**
2. Verify your real business phone number
3. Submit your app for **Business Verification** in Business Settings
4. Once verified, request the **Messaging permission** (`whatsapp_business_messaging`) in App Review

Until App Review is approved, you can only message numbers added as test numbers in the dashboard.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook verification fails (403) | Check `WHATSAPP_VERIFY_TOKEN` matches exactly (case-sensitive) |
| Messages arrive but no reply sent | Check `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` in `.env` |
| `httpx.ConnectError` in logs | Backend can't reach Meta API — check outbound internet from Docker |
| No conversations in `/conversations` | Check `WHATSAPP_CLIENT_ID` is set to a valid client UUID in your DB |
| Reply sent but WhatsApp shows error | Token may be expired — regenerate via System User (Step 4) |
| Webhook not receiving messages | Re-subscribe to **messages** field in Meta dashboard under Webhook Fields |

---

## How the AI Reply Works

When a message arrives:
1. Backend receives the Meta webhook payload
2. `parse_inbound()` extracts the phone number and message text
3. Backend checks that `WHATSAPP_CLIENT_ID` has an active subscription
4. A single AI call generates both a triage analysis and a customer-facing reply
5. Reply is sent via `POST /messages` to Meta Graph API
6. Conversation is logged to the `whatsapp_conversations` database table

The AI uses this response format:
```json
{
  "intent": "booking|support|inquiry|other",
  "urgency": "high|medium|low",
  "language": "en|hi|pa|...",
  "suggested_action": "...",
  "summary": "...",
  "reply": "The actual message sent to the customer"
}
```

---

## Related Files

| File | Purpose |
|---|---|
| `backend/app/api/webhooks.py` | Handles Meta webhook verify + inbound messages |
| `backend/app/services/whatsapp_service.py` | Sends messages via Meta API, parses payloads |
| `backend/app/models/whatsapp_conversation.py` | Stores conversation history |
| `backend/app/api/conversations.py` | Dashboard API to read conversation history |
