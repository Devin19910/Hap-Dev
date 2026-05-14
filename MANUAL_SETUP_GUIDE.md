# Nexora — Manual Setup Guide
### Everything you need to do by hand, in order

This document tracks every task that requires you to click, log in, or configure something
outside of code. Work through it top to bottom. Each section tells you exactly where to go,
what to click, and what to expect.

---

## QUICK REFERENCE CHEAT SHEET

Keep this handy. Everything you need day-to-day.

### What Is Running Right Now

| Service | URL | Status |
|---|---|---|
| **Backend API (local dev)** | http://localhost:8000 | ✅ Running (local) |
| **Backend API (production)** | http://172.30.25.69:8000 | ✅ Running on home server |
| **API Docs (Swagger)** | http://localhost:8000/docs | ✅ Running (local) |
| **PostgreSQL** | localhost:5432 | ✅ Running (internal) |
| **n8n (local dev)** | http://localhost:5678 | ✅ Running (local) |
| **n8n (production)** | http://172.30.25.69:5678 | ✅ Running on home server |
| **Frontend (Vercel — live)** | https://hap-dev.vercel.app | ✅ Live |
| **Frontend (dev server)** | http://localhost:3000 | run `npm run dev` |

### How to Start / Stop the Local Backend

```bash
# Start (from repo root)
cd docker && docker compose up -d

# Stop
cd docker && docker compose down

# Check status
docker compose ps

# View backend logs
docker compose logs backend -f
```

### How to Start the Local Frontend

```bash
# In a separate terminal, from repo root
cd frontend
npm install        # only needed first time
npm run dev        # starts at http://localhost:3000
```

### Your Admin Login

| Field | Value |
|---|---|
| **Login URL** | http://localhost:3000/login |
| **Email** | sodhi.398@gmail.com |
| **Password** | Changeme123! |
| **Role** | owner (full access) |

### n8n Login

| Field | Value |
|---|---|
| **URL (local dev)** | http://localhost:5678 |
| **URL (production)** | http://172.30.25.69:5678 |
| **Email** | sodhi.398@gmail.com |
| **Password (local dev)** | Changeme123! |
| **Password (production)** | c6df9f31451b1196 |

### Two Terminals to Keep Open

| Terminal | What to run | What it does |
|---|---|---|
| Terminal 1 | `cd docker && docker compose up` | Backend + DB + n8n |
| Terminal 2 | `cd frontend && npm run dev` | Next.js frontend |

---

## CURRENT STATUS — WHAT IS DONE VS WHAT STILL NEEDS YOUR ATTENTION

| Task | Status | Section |
|---|---|---|
| Local backend running | ✅ Done | — |
| API keys set (Claude, OpenAI, Gemini) | ✅ Done | — |
| Admin account created | ✅ Done | — |
| Run frontend dev server | ❌ To do | §1 |
| Fix weak secrets in .env | ❌ To do | §2 |
| n8n login + 3 workflows active | ✅ Done | §3 |
| Vercel frontend deployment | ✅ Done — https://hap-dev.vercel.app | §4 |
| Home server (laptop) setup | ✅ Done — 172.30.25.69, all 3 containers running | §5 |
| Cloudflare Tunnel (public backend URL) | ❌ To do | §6 |
| Update Vercel with production backend URL | ❌ To do | §7 |
| WhatsApp Meta app setup | ❌ To do | §8 |
| Register first tenant (test) | ❌ To do | §9 |

---

## §1 — Start the Frontend Dev Server

You need to run this once to confirm the frontend works locally before deploying to Vercel.

1. Open a terminal in WSL2
2. Run:
   ```bash
   cd /home/exit/ai-automation-company-template/frontend
   npm install
   npm run dev
   ```
3. Open your browser: **http://localhost:3000**
4. You should see the Nexora landing page
5. Click **Sign in** → use your admin credentials above
6. You should land on the dashboard

**What to verify:**
- [ ] Landing page loads at http://localhost:3000
- [ ] Sign in works at http://localhost:3000/login
- [ ] Dashboard loads with Overview, Clients, Tenants tabs visible
- [ ] http://localhost:8000/docs loads the API swagger UI

---

## §2 — Fix Weak Secrets in .env

Your `.env` still has placeholder values for two critical security keys.
Do this before exposing the backend publicly.

Open `.env`:
```bash
nano /home/exit/ai-automation-company-template/.env
```

Generate strong random secrets:
```bash
# Run this twice — use output for API_SECRET_KEY and JWT_SECRET_KEY
openssl rand -hex 32
```

Update these two lines with the generated values:
```
API_SECRET_KEY=<paste first output here>
JWT_SECRET_KEY=<paste second output here>
```

Also change the n8n password from `changeme`:
```
N8N_PASSWORD=<strong password of your choice>
```

Then restart the backend to apply:
```bash
cd docker && docker compose up -d --force-recreate backend
```

**What to verify:**
- [ ] API_SECRET_KEY is no longer `change-me-in-production`
- [ ] JWT_SECRET_KEY is no longer `change-this-jwt-secret-in-production`
- [ ] You can still log in to the dashboard after restarting

---

## §3 — n8n Login and Workflow Setup ✅ DONE

n8n is your automation engine for CRM notifications and appointment reminders.
**This section is already complete** — all 3 workflows were imported and activated programmatically.

### Current state:
- ✅ n8n owner account: `sodhi.398@gmail.com` / `Changeme123!`
- ✅ `CRM New Lead Notification` workflow — Active (webhook: `/webhook/crm-new-lead`)
- ✅ `Appointment Reminder` workflow — Active (webhook: `/webhook/appointment-confirmed`)
- ✅ `AI Triage Workflow` — Active (webhook: `/webhook/ai-triage`)
- ✅ Webhook URLs set in `.env` as `N8N_NEW_LEAD_WEBHOOK` and `N8N_APPOINTMENT_WEBHOOK`

### If you ever need to re-import a workflow:
1. Go to **http://localhost:5678** and log in
2. Click **+** → **Import from file**
3. Select the JSON from `automation/n8n/`
4. Toggle the workflow **Active**

### If you need to re-set the webhook URLs in .env:
```
N8N_NEW_LEAD_WEBHOOK=http://n8n:5678/webhook/crm-new-lead
N8N_APPOINTMENT_WEBHOOK=http://n8n:5678/webhook/appointment-confirmed
```
Note: use `http://n8n:5678` (Docker internal hostname), not `localhost`, when the backend calls n8n.

---

## §4 — Deploy Frontend to Vercel ✅ DONE

**Live URL: https://hap-dev.vercel.app**

Repo `Devin19910/Hap-Dev` is connected to Vercel with root directory set to `frontend`.
Every push to `main` on GitHub automatically triggers a new Vercel build and deploy.

### Current state:
- ✅ Vercel project connected to GitHub repo (root: `frontend`)
- ✅ https://hap-dev.vercel.app — landing page live
- ✅ https://hap-dev.vercel.app/login — login page live
- ✅ https://hap-dev.vercel.app/register — register page live
- ✅ https://hap-dev.vercel.app/dashboard — dashboard working
- ⚠️ `NEXT_PUBLIC_API_URL` not yet set in Vercel — currently falls back to `http://localhost:8000`

### What you need to do in §7 (after home server is live):
1. Vercel dashboard → your project → **Settings → Environment Variables**
2. Add: `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
3. Vercel → **Deployments** → Redeploy latest

This is the only remaining step to make the live Vercel site talk to the production backend.

---

## §5 — Set Up the Home Server (Spare Laptop)

Full instructions are in `sops/server_deployment.md`. Summary below.

### ✅ DONE — Home Server Is Running

**Server:** `nexora@nexora-server` at `172.30.25.69`

All 3 containers running (as of 2026-05-14):
- `nexora-backend-1` — Up, healthy (port 8000)
- `nexora-postgres-1` — Up, healthy (internal only)
- `nexora-n8n-1` — Up (port 5678)

To update the server when code changes:
```bash
# Type this on the server screen (or SSH if you get it working)
cd ~/nexora && bash deploy.sh
```

To check status:
```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
```

---

## §6 — Expose Backend to the Internet (Cloudflare Tunnel)

This gives the home server a public HTTPS URL so Vercel and WhatsApp can reach it.

**Requirements:** A domain in Cloudflare (add your domain at cloudflare.com, update nameservers at your registrar).

### 6.1 — Install cloudflared on the Server

SSH into the home server, then:
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 6.2 — Authenticate

```bash
cloudflared tunnel login
```

Copy the URL it gives you → open in your browser → log in to Cloudflare → select your domain.

### 6.3 — Create Tunnel

```bash
cloudflared tunnel create nexora-backend
```

Note the **Tunnel UUID** it prints. Write it here: `_______________________________________`

### 6.4 — Create Config File

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste this (replace YOUR_TUNNEL_UUID and yourdomain.com):
```yaml
tunnel: YOUR_TUNNEL_UUID
credentials-file: /home/nexora/.cloudflared/YOUR_TUNNEL_UUID.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  - hostname: n8n.yourdomain.com
    service: http://localhost:5678
  - service: http_status:404
```

### 6.5 — Create DNS Records

```bash
cloudflared tunnel route dns nexora-backend api.yourdomain.com
cloudflared tunnel route dns nexora-backend n8n.yourdomain.com
```

### 6.6 — Run as a System Service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 6.7 — Test

```bash
curl https://api.yourdomain.com/health
# Expected: {"status": "ok"}
```

Write your public URLs here:
- **Backend API:** `https://api.___________________`
- **n8n:** `https://n8n.___________________`

**What to verify:**
- [ ] `https://api.yourdomain.com/health` returns `{"status": "ok"}` from any device
- [ ] `https://api.yourdomain.com/docs` shows the Swagger UI
- [ ] `https://n8n.yourdomain.com` shows the n8n login screen

---

## §7 — Update Vercel with the Real Backend URL

Now that the backend has a public URL, tell your Vercel frontend to use it.

1. Go to **vercel.com** → your project → **Settings → Environment Variables**
2. Click the edit pencil next to `NEXT_PUBLIC_API_URL`
3. Change the value to your real backend URL:
   ```
   https://api.yourdomain.com
   ```
4. Click **Save**
5. Go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

**What to verify:**
- [ ] Nexora Vercel site can reach the backend: open the site → try to log in
- [ ] Login works from the live Vercel URL (not just localhost)

---

## §8 — WhatsApp Setup (Meta Developer App)

This lets customers message your business on WhatsApp and get AI replies.

Full guide: `sops/whatsapp_setup.md`

### Quick steps:

1. Go to **developers.facebook.com** → My Apps → Create App → Business
2. Add **WhatsApp** product
3. Get your credentials from the WhatsApp → Getting Started page:
   - `WHATSAPP_PHONE_NUMBER_ID` = the number ID shown
   - `WHATSAPP_ACCESS_TOKEN` = temporary token (upgrade to permanent — see SOP)
4. Add to your `.env` on the home server:
   ```
   WHATSAPP_PHONE_NUMBER_ID=<your value>
   WHATSAPP_ACCESS_TOKEN=<your value>
   WHATSAPP_VERIFY_TOKEN=nexora-verify-2026   # you choose this string
   ```
5. Restart backend: `bash deploy.sh`
6. Register the webhook in Meta dashboard:
   - **Callback URL:** `https://api.yourdomain.com/webhooks/whatsapp`
   - **Verify Token:** `nexora-verify-2026` (must match what you set above)
7. Subscribe to the `messages` webhook field

**What to verify:**
- [ ] Meta webhook verification passes (green tick in Meta dashboard)
- [ ] Send a test message to your WhatsApp number
- [ ] Check `https://api.yourdomain.com/conversations` for the incoming message
- [ ] The AI replies automatically over WhatsApp

---

## §9 — Register Your First Tenant (Test the Self-Service Flow)

This tests the complete signup → dashboard flow as a client would experience it.

1. Open your Vercel URL: `https://your-nexora.vercel.app/register`
2. Fill in:
   - Business name: `Test Salon`
   - Business type: Salon / Barbershop
   - Email: use a second email address (not your admin email)
   - Password: any strong password
3. Click **Create free account**
4. You should be automatically logged in and see a tenant-scoped dashboard
   (no Clients, Tenants, or Team tabs — only Overview, WhatsApp, Contacts, Appointments, Settings)
5. Log out, then log back in at `/login` with your admin credentials
6. Go to the **Tenants** tab — the new tenant should appear in the list

**What to verify:**
- [ ] Self-service registration works end-to-end
- [ ] Tenant dashboard shows correct scoped tabs
- [ ] Platform admin Tenants tab shows the new tenant
- [ ] Tenant appears in the database

---

## §10 — Accounts You Need (Checklist)

| Service | Purpose | URL | Status |
|---|---|---|---|
| GitHub | Code repo | github.com (Devin19910/Hap-Dev) | ✅ Have |
| Anthropic | Claude AI key | console.anthropic.com | ✅ Have |
| OpenAI | GPT-4o key | platform.openai.com | ✅ Have |
| Google AI | Gemini key | aistudio.google.com | ✅ Have |
| Vercel | Frontend hosting | vercel.com | ✅ Have (not connected yet) |
| Meta/Facebook | WhatsApp Business | developers.facebook.com | ❓ Need to check |
| Cloudflare | Tunnel + DNS | cloudflare.com | ❓ Need to check |
| Domain registrar | yourdomain.com | namecheap.com / godaddy.com | ❓ Need to check |
| HubSpot | CRM (optional) | app.hubspot.com | 🔜 Optional |
| Zoho CRM | CRM (optional) | crm.zoho.com | 🔜 Optional |
| Google Cloud | Google Calendar (optional) | console.cloud.google.com | 🔜 Optional |

---

## §11 — Daily Operations Reference

### Starting everything in the morning

**Terminal 1** (keep open — backend):
```bash
cd /home/exit/ai-automation-company-template/docker
docker compose up
```

**Terminal 2** (keep open — frontend, only needed for local dev):
```bash
cd /home/exit/ai-automation-company-template/frontend
npm run dev
```

### Deploying an update to the home server

```bash
# SSH into the home server
ssh nexora@192.168.x.x

# Run the deploy script
cd nexora
bash deploy.sh
```

### Viewing logs

```bash
# Backend logs
docker compose logs backend -f

# n8n logs
docker compose logs n8n -f

# All logs
docker compose logs -f
```

### Database access (if you ever need to look at data directly)

```bash
# Local dev
docker exec -it docker-postgres-1 psql -U user -d appdb

# Production
docker compose -f docker-compose.prod.yml exec postgres psql -U nexora -d nexora
```

### Resetting a forgotten admin password

```bash
# Connect to the database
docker exec -it docker-postgres-1 psql -U user -d appdb

# Run SQL (replace hash with bcrypt of new password)
UPDATE admin_users SET hashed_password = '<bcrypt hash>' WHERE email = 'sodhi.398@gmail.com';

# Or just use the API (easier):
curl -X POST http://localhost:8000/auth/token \
  -d "username=sodhi.398@gmail.com&password=Changeme123!"
```

---

## §12 — Things to Do Before Going Live with Real Clients

- [ ] Change `ADMIN_PASSWORD` from `Changeme123!` to something stronger
- [ ] Set strong `API_SECRET_KEY` and `JWT_SECRET_KEY` (see §2)
- [ ] Change n8n password from `changeme`
- [ ] Set a real `WEBHOOK_SECRET` (not the placeholder)
- [ ] Add your domain to Cloudflare and set up the tunnel (§6)
- [ ] Update Vercel `NEXT_PUBLIC_API_URL` to the real backend URL (§7)
- [ ] Test the full WhatsApp flow with a real message (§8)
- [ ] Import and activate n8n workflows (§3)
