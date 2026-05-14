# SOP: Appointment Booking System Setup

## What This Does

Manages appointments end-to-end:
1. Customer sends a WhatsApp message requesting a booking
2. AI detects the booking intent and asks for date/time preference
3. A **pending** appointment is auto-created in the dashboard
4. Operator opens the **Appointments** tab, picks a date/time, and confirms
5. Google Calendar event is created automatically (if configured)
6. Customer receives a WhatsApp confirmation
7. n8n sends an automated reminder 24h before the appointment

---

## Part 1 — Internal Booking (No Setup Needed)

The booking system works out of the box. WhatsApp messages with booking intent automatically appear in the **Appointments** tab as "pending" entries.

To confirm an appointment:
1. Open the admin dashboard → **Appointments** tab
2. Click on a pending appointment
3. Set the date/time, duration, and service name
4. Optionally check "Notify customer via WhatsApp"
5. Click **Confirm**

---

## Part 2 — Google Calendar Setup

### 2.1 Create OAuth2 Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API**: APIs & Services → Enable APIs → search "Google Calendar API"
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized redirect URI: `https://developers.google.com/oauthplayground`
7. Note the **Client ID** and **Client Secret**

### 2.2 Generate a Refresh Token

1. Open [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Click the gear icon → check **Use your own OAuth credentials** → enter your Client ID and Secret
3. In Step 1, select **Google Calendar API v3** → `https://www.googleapis.com/auth/calendar.events`
4. Click **Authorize APIs** → sign in with the Google account whose calendar you want to use
5. In Step 2, click **Exchange authorization code for tokens**
6. Copy the **Refresh token**

### 2.3 Find Your Calendar ID

1. Open [calendar.google.com](https://calendar.google.com)
2. Hover over the calendar you want to use → click the three-dot menu → **Settings and sharing**
3. Scroll to **Integrate calendar** → copy the **Calendar ID**
   - For your main calendar it's usually your Gmail address

### 2.4 Configure .env

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALENDAR_ID=primary               # or your-email@gmail.com
GOOGLE_TIMEZONE=Asia/Kolkata             # or America/New_York, UTC, etc.
```

Restart the backend:
```bash
docker compose up -d --force-recreate backend
```

### 2.5 Verify

Confirm an appointment from the dashboard. Open Google Calendar — the event should appear within seconds.

---

## Part 3 — Appointment Reminder Workflow (n8n)

### 3.1 Import the Workflow

1. Open n8n at `http://localhost:5678`
2. Go to **Workflows → New → Import from file**
3. Upload `automation/n8n/appointment_reminder_workflow.json`
4. Activate the workflow

### 3.2 Get the Webhook URL

1. Open the workflow
2. Click the **Webhook** node
3. Copy the **Production URL** (e.g. `http://n8n:5678/webhook/appointment-confirmed`)

### 3.3 Configure .env

```env
N8N_APPOINTMENT_WEBHOOK=http://n8n:5678/webhook/appointment-confirmed
```

Restart the backend:
```bash
docker compose up -d --force-recreate backend
```

### 3.4 How It Works

When an appointment is confirmed from the dashboard:
1. The backend POSTs to `N8N_APPOINTMENT_WEBHOOK` with appointment details
2. n8n starts a timer — waits until **24 hours before** the appointment time
3. n8n calls `POST /appointments/{id}/send-reminder` on the backend
4. Backend sends the WhatsApp reminder to the customer

The Wait node in the n8n workflow is fixed at 24 hours. To adjust the reminder timing, edit the **Wait** node in n8n and change the duration.

---

## Appointment Statuses

| Status | Meaning |
|---|---|
| `pending` | Captured from WhatsApp, needs operator to confirm time |
| `confirmed` | Operator has confirmed date/time, Google Calendar event created |
| `completed` | Appointment happened (set manually by operator) |
| `cancelled` | Cancelled — Google Calendar event deleted |

---

## WhatsApp Booking Flow

When a customer sends a message like "I want to book a haircut":
1. AI detects `intent: booking`
2. AI reply asks: *"I'd love to help you book! What day and time works best for you?"*
3. A **pending** appointment appears in the dashboard with the customer's message as "notes"
4. Operator sees it, checks availability, confirms the time
5. Customer gets: *"Your haircut is confirmed for Tuesday, May 20 at 10:00 AM. See you then!"*

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Google Calendar event not created | Check `GOOGLE_REFRESH_TOKEN` is set. Look for `[gcal]` errors in backend logs |
| Token refresh fails | Re-generate the refresh token using OAuth Playground (Step 2.2) |
| Reminder not sent | Check n8n workflow is active, `N8N_APPOINTMENT_WEBHOOK` is correct |
| Appointments not appearing from WhatsApp | Check `WHATSAPP_CLIENT_ID` is set — appointments need a client_id |
| Confirmation message not received | Check `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are valid |

---

## Related Files

| File | Purpose |
|---|---|
| `backend/app/models/appointment.py` | Appointment DB model |
| `backend/app/services/appointment_service.py` | Core booking logic |
| `backend/app/services/google_calendar_service.py` | Google Calendar API calls |
| `backend/app/api/appointments.py` | REST endpoints |
| `automation/n8n/appointment_reminder_workflow.json` | n8n 24h reminder workflow |
