# Nexora — Client Onboarding Playbook
### For: Cousin (Punjab operator) · Written by: Dev
### Open this doc on one side of your screen. Open the dashboard on the other side.

**Dashboard URL:** https://hap-dev.vercel.app/login
**Your login:** sodhi.398@gmail.com / Changeme123!
**Time per client:** ~20 minutes

---

## BEFORE YOU START — What to collect from the client

Send them this WhatsApp message first (copy-paste):

> *"Bhai, mujhe ye 5 cheezein chahiye taki main aapka AI system set up kar sakun:*
> *1. Business ka naam*
> *2. Email address (jo aap regularly check karte ho)*
> *3. Password banana chahte ho dashboard ke liye*
> *4. Business type (salon / clinic / gym / immigration / other)*
> *5. WhatsApp number jo customers use karte hain aapko contact karne ke liye"*

Write their answers here before you start:

```
Business Name:    ________________________________
Email:            ________________________________
Password:         ________________________________
Business Type:    ________________________________
WhatsApp Number:  ________________________________
Plan:             Free / Basic ($29) / Pro ($99)
```

---

## PHASE 1 — Create Their Account (3 minutes)

### Option A — Client signs up themselves (easiest)
1. Send them this link: **https://hap-dev.vercel.app/register**
2. Tell them to fill in: Business name, Business type, Email, Password
3. They click **Create account** → they're in automatically
4. They message you when done → go to Phase 2

### Option B — You create it for them
1. Open dashboard → log in with your admin account
2. Click **Clients** tab (left sidebar)
3. Click **Create** button (top right of the client list)
4. Fill in:
   - Business name → type their name
   - Email → type their email
   - Tier → start with **Free** (they can upgrade later)
5. Click **Create**
6. ✅ Done — their account exists now

---

## PHASE 2 — Find Their Account in the Dashboard (2 minutes)

1. Click **Tenants** tab (left sidebar)
2. You will see a list of all accounts
3. Find their business name → click on it
4. You are now inside their account
5. Click the **Settings** button or link for their tenant

> **What you should see:** Their business name at the top, empty fields for WhatsApp, CRM, etc.

---

## PHASE 3 — Set Up Basic Info (2 minutes)

In their Settings page:

1. **Business name** → confirm it's correct, edit if needed
2. **Business type** → select from the dropdown (salon, clinic, gym, etc.)
3. **AI Provider** → leave as **Claude** (best quality, default)
4. Scroll down → click **Save Settings**
5. ✅ Done

---

## PHASE 4 — WhatsApp Setup

> ⚠️ **NOTE:** WhatsApp AI is waiting for Meta to approve Nexora's app (expected within 48 hours as of May 15).
> Complete Steps 4A and 4B now. Step 4C (going live) — do when Meta approves.

### Step 4A — What the client needs to do (their side)

The client needs a **WhatsApp Business API** number from Meta. Two options:

**Simple option (for now):** Use Nexora's shared number temporarily.
- Tell the client: "For now, customers message our Nexora test number. When your own number is ready, we switch it."
- Skip 4B for now and move to Phase 5.

**Full option (their own WhatsApp number):**
- Client needs a Facebook Business account
- Tell them to go to **business.facebook.com** and create one
- Once they have it, they need to add a WhatsApp number
- This takes 1-2 days with Meta — schedule a separate call for this

### Step 4B — Enter their WhatsApp credentials (when they have them)

In their Settings page in the dashboard:

1. Scroll to **WhatsApp Cloud API** section
2. Fill in:
   - **Phone Number ID** → from their Meta Developer Dashboard
   - **Access Token** → their permanent system user token
   - **Verify Token** → create any secret word (e.g. `nexora-clientname-2026`)
   - **Business Name** → their business name exactly
3. Click **Save Settings**

### Step 4C — Register the webhook with Meta (when Meta approves Nexora)

Tell the client to go to their Meta Developer app:
- Webhook URL: `https://nexora.cmdfleet.com/webhooks/whatsapp/THEIR_TENANT_ID`
- Verify token: whatever you set in Step 4B
- Subscribe to: messages

> **Find their Tenant ID:** Tenants tab → click their name → the ID is in the URL or shown on their profile page.

---

## PHASE 5 — Test the AI (5 minutes)

Once WhatsApp is connected:

1. Take your personal phone → send a WhatsApp message to their business number
   - Example message: *"Hi, I want to book an appointment"*
2. Wait 10-15 seconds
3. The AI should reply automatically

**Then check the dashboard:**
- Click **WhatsApp** tab → you should see the conversation appear
- Click **Contacts** tab → you should see your phone number added as a contact
- If the message was about booking → click **Appointments** tab → a pending appointment should appear

**If the AI did not reply:** See Troubleshooting section at the bottom.

---

## PHASE 6 — Upgrade Their Plan (if they are paying)

1. **Option A — They pay themselves:**
   - Send them the dashboard link: **https://hap-dev.vercel.app/login**
   - Tell them: "Log in → go to Settings → click Basic or Pro → enter your card"
   - Stripe handles the payment — plan upgrades instantly

2. **Option B — You upgrade them manually:**
   - Go to **Clients** tab → click their name → find the subscription section
   - Change tier → click **Change Tier**
   - Note: they will not be charged — use this only for trial/demo clients

---

## PHASE 7 — Show the Client Their Dashboard (5 minutes)

Share your screen or sit with them. Walk them through:

| Tab | Tell them this |
|---|---|
| **WhatsApp** | "Here you can see every customer who messages you — what they asked, what the AI said" |
| **Contacts** | "Every customer is automatically saved here as a lead. You can see their intent and urgency" |
| **Appointments** | "When a customer asks to book — it appears here as Pending. You confirm the date and time, it goes to Google Calendar" |
| **Settings** | "This is where your WhatsApp and other connections live. Don't change anything without asking me" |

**Give them their login:**
- URL: https://hap-dev.vercel.app/login
- Email: (what they registered with)
- Password: (what they set)

Tell them: *"Jab bhi koi customer message kare aapke WhatsApp pe, AI khud reply karega. Aap dashboard pe sab kuch dekh sakte ho."*

---

## PHASE 8 — Collect Payment (if applicable)

**Basic plan — $29/month** (500 AI replies/month) — good for most small businesses
**Pro plan — $99/month** (5,000 AI replies/month) — for busy businesses

For Indian clients pricing (approximate):
- Basic → ₹2,400/month
- Pro → ₹8,200/month

Payment is done by client directly on the dashboard with their card. You do not handle money — Stripe handles it automatically.

---

## DONE — Final Checklist

Before you close the call, confirm everything:

- [ ] Account created and client can log in
- [ ] Business name and type set correctly
- [ ] AI provider set to Claude
- [ ] WhatsApp credentials entered (or scheduled for later)
- [ ] Test message sent and AI replied (or scheduled for when Meta approves)
- [ ] Client knows their dashboard URL and login
- [ ] Plan upgraded or client knows how to pay
- [ ] Client has your WhatsApp number for support

---

## TROUBLESHOOTING

### "AI did not reply to test message"
1. Dashboard → Tenants → their account → check WhatsApp credentials are saved
2. Check that the webhook is registered with Meta (Step 4C)
3. SSH into server: `ssh nexora@192.168.168.98`
4. Run: `docker compose -f ~/nexora/docker-compose.prod.yml logs backend --tail=50`
5. Look for any red error lines — message Dev with screenshot

### "Client can't log in"
- Check their email is correct in the Clients tab
- Reset their password: Clients tab → their name → there is no password reset button yet
- Quick fix: tell them to register again with a slightly different email, then you delete the old one

### "Appointment not appearing"
- The AI only creates appointments when it detects booking intent in the message
- Test with: *"I want to book an appointment for tomorrow"* (very clear booking intent)

### "Plan not upgrading after payment"
- Check Stripe Dashboard → Payments → confirm payment went through
- If payment succeeded but plan didn't update → message Dev immediately

### "I don't know their Tenant ID"
- Dashboard → Tenants tab → click their name → look at the URL in your browser
- It will say something like `/tenants/28cc6e81-4e4c-4e31-b0ef-18042ff0c9b5` — that long number is their ID

---

## NOTES SECTION (fill this in for each client)

```
Client 1:
  Business Name:   ___________________________
  Email:           ___________________________
  Tenant ID:       ___________________________
  Plan:            ___________________________
  WhatsApp No:     ___________________________
  Onboarded on:    ___________________________
  Notes:           ___________________________

Client 2:
  Business Name:   ___________________________
  Email:           ___________________________
  Tenant ID:       ___________________________
  Plan:            ___________________________
  WhatsApp No:     ___________________________
  Onboarded on:    ___________________________
  Notes:           ___________________________
```

---

*Last updated: May 2026 · Questions → message Dev on WhatsApp*
