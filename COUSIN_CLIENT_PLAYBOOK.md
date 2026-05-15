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

> ⚠️ **NOTE:** Nexora's WhatsApp app is waiting for Meta approval (expected soon).
> Once Meta approves, all clients go live automatically.

**Choose the right path for this client:**

| | Path A — Zero Setup | Path B — Full Setup |
|---|---|---|
| **Time** | 5 minutes | 20 minutes |
| **Client needs** | Nothing | A Facebook account |
| **Number used** | Nexora's shared number (temporary) | Their own business number (permanent) |
| **Best for** | Close the sale today, sort number later | Client wants their own branding from day 1 |
| **Privacy** | Customers see "Nexora" | Customers see the client's own business name |

> **How to decide:** If the client is hesitating or has no tech setup at all — start with **Path A** to get them live today and build trust. Then migrate to **Path B** within the first month. If they are already comfortable — go straight to **Path B**.

---

### Path A — Zero Setup (5 minutes, start today)

Use Nexora's shared number as a temporary starter. The client's dashboard goes live immediately.

What you tell the client:
> *"Aaj hum aapko live kar dete hain. Abhi ke liye customers hamare Nexora number pe message karenge. Agli baar milne par aapka apna number connect kar denge — that's when your name shows up."*

**In the dashboard:**
1. Go to **Tenants** tab → click their account → **Settings**
2. Scroll to **WhatsApp Cloud API**
3. Fill in:
   - **Phone Number ID** → `1091106447424755`
   - **Access Token** → ask Dev for current token (in DEVINDER_KNOWLEDGE.md)
   - **Verify Token** → `nexora-verify-2026`
   - **Business Name** → their business name
4. Click **Save Settings** ✅

They are live. Schedule a second session to complete Path B and migrate to their own number.

---

### Path B — Full Setup (own number, 20 minutes)

**Real example — John's Pizza Restaurant**

John has a pizza place. He has no LLC, no EIN, no tech setup. Here is how you connect him:

**What John needs:**
- A personal Facebook account (almost everyone has one)
- His existing phone number (the one customers already call/WhatsApp)
- 20 minutes

**Step 1 — Create a free Facebook Business account (5 minutes)**

Tell John to do this, or do it with him on screen share:

1. Go to **business.facebook.com**
2. Click **Create Account**
3. Log in with his personal Facebook
4. Business name → type `John's Pizza` (no legal name needed, no documents needed)
5. His email → enter it
6. Click **Submit** → Business account is created ✅

> He does NOT need LLC, EIN, or any legal documents. A business name is enough.

**Step 2 — Add his phone number to WhatsApp Business Platform (10 minutes)**

1. Inside his Facebook Business account → go to **Settings** (bottom left)
2. Click **WhatsApp accounts** → click **Add**
3. Click **Create a WhatsApp account**
4. Enter his phone number → Meta sends a verification code via SMS or call
5. Enter the code → number is verified ✅
6. Meta gives him a **Phone Number ID** — copy it (looks like: `107839281234567`)
7. He will also need an **Access Token** — click **System Users** → create one → copy the token

> If John's number is already used on regular WhatsApp or WhatsApp Business app — he will need to delete it from that app first, then add it here. Meta cannot use the same number in two places.

**Step 3 — Enter his credentials in the Nexora dashboard**

1. Go to **Tenants** tab → click his account → click **Settings**
2. Scroll to **WhatsApp Cloud API** section
3. Fill in:
   - **Phone Number ID** → the number ID from Step 2
   - **Access Token** → the token from Step 2
   - **Verify Token** → type `nexora-johnspizza-2026` (any secret word, keep it simple)
   - **Business Name** → `John's Pizza`
4. Click **Save Settings** ✅

**Step 4 — Register the webhook with Meta**

1. In Facebook Business → go to his WhatsApp app settings → **Webhooks**
2. Webhook URL → `https://nexora.cmdfleet.com/webhooks/whatsapp/TENANT_ID`
   - Replace `TENANT_ID` with his actual ID (Tenants tab → click his name → copy ID from URL)
3. Verify Token → same word you set above (`nexora-johnspizza-2026`)
4. Click **Verify and Save**
5. Subscribe to → **messages** ✅

> Now when any customer WhatsApps John's number, the AI picks it up and replies automatically. John's customers see "John's Pizza" — they never see Nexora.

---

### Quick-reference — 2 types of clients

| Client type | What they need | Your work |
|---|---|---|
| **Has nothing** (like John) | Personal Facebook account + their phone number | Walk them through Steps 1–4 above (~20 min) |
| **Already has WhatsApp Business API** | Just give you their Phone Number ID + token | Enter credentials in dashboard only (~5 min) |

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

**Account**
- [ ] Account created and client can log in
- [ ] Business name and type set correctly
- [ ] AI provider set to Claude

**WhatsApp**
- [ ] Client has a Facebook Business account (or you created one with them)
- [ ] Their phone number is added and verified on Meta WhatsApp Business Platform
- [ ] Phone Number ID and Access Token copied from Meta
- [ ] Credentials entered in Nexora dashboard → Settings → WhatsApp Cloud API
- [ ] Webhook registered with Meta (their tenant webhook URL + verify token)
- [ ] Test message sent from your phone → AI replied ✅

**Dashboard**
- [ ] Client knows their dashboard URL and login (hap-dev.vercel.app/login)
- [ ] You showed them: WhatsApp tab, Contacts tab, Appointments tab, Overview tab
- [ ] Client understands they can see everything but should not change Settings

**Payment**
- [ ] Plan upgraded or client knows how to pay from Settings tab

**Support**
- [ ] Client has your WhatsApp number for help
- [ ] You wrote their details in the Notes section below

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
