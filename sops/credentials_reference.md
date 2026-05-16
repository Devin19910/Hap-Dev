# Nexora — Credentials & Key Reference

> **SECURITY:** This file documents WHERE credentials live and what they are for.
> Never share this file publicly. Never commit real secret values to GitHub.
> Real values live ONLY in `.env` on the production server at `~/nexora/.env`.

---

## How to Access the Server

| Method | Details |
|---|---|
| **SSH (from WSL2)** | `ssh -o StrictHostKeyChecking=no nexora@192.168.168.98` |
| **Server IP** | `192.168.168.98` (DHCP — may change on reboot; run `hostname -I` on server if it changes) |
| **SSH password** | `Admin123` |
| **Server user** | `nexora` |
| **Repo path** | `~/nexora` |
| **RDP (remote desktop)** | Tailscale IP `100.82.163.125` → port 3389, user `AdminNote` |

---

## Dashboard Logins

| System | URL | Email | Password |
|---|---|---|---|
| **Nexora Dashboard** | https://hap-dev.vercel.app/login | sodhi.398@gmail.com | Changeme123! |
| **n8n** | https://nexora-n8n.cmdfleet.com | admin | c6df9f31451b1196 |
| **Meta Business Suite** | https://business.facebook.com | sodhi.398@gmail.com | (Facebook password) |
| **Meta Developer Console** | https://developers.facebook.com | sodhi.398@gmail.com | (Facebook password) |
| **Cloudflare** | https://dash.cloudflare.com | (Cloudflare account) | — |
| **GoDaddy (cmdfleet.com)** | https://godaddy.com | (GoDaddy account) | — |
| **Vercel (frontend)** | https://vercel.com | (Vercel account) | — |

---

## WhatsApp (LIVE as of 2026-05-16)

| Field | Value |
|---|---|
| **Business number** | +1 (781) 354-7229 |
| **Phone Number ID** | `1152371264619437` |
| **WhatsApp Business Account ID** | `996017332866246` |
| **Meta App name** | Nexora Solutions |
| **Webhook URL** | `https://nexora.cmdfleet.com/webhooks/whatsapp` |
| **Verify token** | `nexora-verify-2026` |
| **Access token** | Permanent System User token — stored in server `.env` as `WHATSAPP_ACCESS_TOKEN` |
| **Test client ID** | `28cc6e81-4e4c-4e31-b0ef-18042ff0c9b5` |
| **Display name status** | "Nexora" — In review (cosmetic, does not block API) |

> **Note:** The access token is a permanent System User token (never expires).
> If it ever stops working, regenerate from:
> Meta Business Suite → Settings → Users → System Users → Nexora Bot → Generate new token

---

## Backend API

| Field | Value |
|---|---|
| **Production API URL** | `https://nexora.cmdfleet.com` |
| **Health check** | `https://nexora.cmdfleet.com/health` |
| **API docs (Swagger)** | `https://nexora.cmdfleet.com/docs` |
| **API Secret Key** | Stored in `.env` as `API_SECRET_KEY` |
| **JWT Secret** | Stored in `.env` as `JWT_SECRET_KEY` |
| **Webhook Secret** | `nexora-webhook-2026-zM7oR1vT4kB` |

---

## AI Providers

| Provider | Env Var | Notes |
|---|---|---|
| **Claude (Anthropic)** | `CLAUDE_API_KEY` | Default provider — `claude-sonnet-4-6` |
| **OpenAI** | `OPENAI_API_KEY` | Fallback option |
| **Gemini** | `GEMINI_API_KEY` | Fallback option |
| **Active provider** | `DEFAULT_AI_PROVIDER=claude` | Switch via this env var |

---

## Stripe Billing

| Field | Value |
|---|---|
| **Mode** | TEST (switch to live when ready) |
| **Keys** | Stored in `.env` as `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` |
| **Webhook secret** | Stored in `.env` as `STRIPE_WEBHOOK_SECRET` |
| **Go-live checklist** | See `sops/stripe_setup.md` |

---

## Infrastructure

| Service | Details |
|---|---|
| **Production server** | Home laptop — Ubuntu 24.04 LTS, IP `192.168.168.98` |
| **Frontend** | Vercel — auto-deploys on push to `main` branch |
| **Backend** | Docker Compose on home server — port 8000 |
| **Database** | PostgreSQL in Docker — internal only |
| **n8n** | Docker — port 5678 |
| **Internet exposure** | Cloudflare Tunnel → `cmdfleet.com` |
| **Domain** | `cmdfleet.com` (GoDaddy, DNS via Cloudflare) |
| **Backend public URL** | `https://nexora.cmdfleet.com` |
| **n8n public URL** | `https://nexora-n8n.cmdfleet.com` |

---

## How to Update Production

```bash
# SSH into server
ssh nexora@192.168.168.98

# Pull latest code + rebuild + restart
cd ~/nexora && git pull && bash deploy.sh
```

Or Claude Code can do this directly via SSH.

---

## Environment File Location

Real values are in `/home/nexora/nexora/.env` on the server.
Template is at `backend/.env.example` in the repo.

To view current values on server:
```bash
ssh nexora@192.168.168.98 "cat ~/nexora/.env"
```

---

## For the India Operator (Cousin — Punjab)

The cousin's job is client delivery. He does NOT need server access.
He uses:
- **Nexora Dashboard** → https://hap-dev.vercel.app/login
- Login: sodhi.398@gmail.com / Changeme123!
- For any issues → contact the US owner (Devin)

New client onboarding → follow `sops/client_onboarding.md`
