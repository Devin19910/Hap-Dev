# SOP: Backend Server Deployment (Home Server / Laptop)

## What This Does
Deploys the full Nexora backend stack on a spare laptop running Ubuntu:
- **FastAPI backend** (port 8000) — AI, WhatsApp, CRM, appointments API
- **PostgreSQL** (internal only) — database
- **n8n** (port 5678) — automation workflows

Then exposes the backend to the public internet so:
- The Vercel frontend can call the API
- Meta can send WhatsApp webhook events
- Your cousin in India can access the n8n dashboard

---

## Prerequisites
- Spare laptop with Ubuntu 24.04 LTS installed (see Part 0)
- A domain name (e.g. `nexora.io`) — optional but strongly recommended
- Router with port forwarding ability OR a Cloudflare account (free)

---

## Part 0 — Install Ubuntu on the Laptop

1. Download **Ubuntu Server 24.04 LTS** from ubuntu.com/download/server
2. Flash to a USB drive using [Balena Etcher](https://etcher.balena.io)
3. Boot the laptop from USB, follow installer:
   - Set username (e.g. `nexora`)
   - Set a strong password
   - Enable **OpenSSH server** during install
   - Use the full disk, no LVM needed
4. Note the laptop's local IP after boot:
   ```bash
   ip addr show | grep "inet " | grep -v 127
   ```
5. From your Windows machine, SSH in to confirm it works:
   ```bash
   ssh nexora@192.168.x.x
   ```

---

## Part 1 — Install Docker on the Server

SSH into the laptop, then run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (no sudo needed after)
sudo usermod -aG docker $USER

# Log out and back in for the group change to take effect
exit
# SSH back in, then verify:
docker --version
docker compose version
```

---

## Part 2 — Clone the Repo

```bash
# Install git
sudo apt install -y git

# Clone the repo
git clone https://github.com/Devin19910/Hap-Dev.git nexora
cd nexora
```

---

## Part 3 — Set Up the .env File

```bash
# Copy the template
cp .env.example .env

# Edit with your real values
nano .env
```

Key values to fill in for production:

```env
# Strong random secrets — generate with: openssl rand -hex 32
API_SECRET_KEY=<generate>
JWT_SECRET_KEY=<generate>
DB_PASSWORD=<generate>
WEBHOOK_SECRET=<generate>

# Your AI API keys
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Admin login for the dashboard
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=<strong-password>
ADMIN_FIRST_NAME=Devinder

# n8n (will update N8N_HOST after exposing publicly)
N8N_USER=admin
N8N_PASSWORD=<strong-password>

# Leave WhatsApp/HubSpot/Zoho/Google Calendar blank for now
# Configure them per-tenant from the dashboard after deployment
```

Save and exit nano: `Ctrl+X → Y → Enter`

---

## Part 4 — Start the Production Stack

```bash
# From the repo root on the server
docker compose -f docker-compose.prod.yml up -d
```

Wait about 30 seconds, then verify:

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:8000/health

# Check API docs are accessible
curl -s http://localhost:8000/ | python3 -m json.tool
```

Expected output from health check:
```json
{"status": "ok"}
```

**First boot:** The backend automatically runs Alembic migrations and seeds the admin account.

---

## Part 5 — Expose to the Internet

You need a public URL for:
- Vercel frontend to call the API
- Meta WhatsApp to send webhook events

Choose **Option A** (recommended for home servers) or **Option B**.

---

### Option A — Cloudflare Tunnel (Recommended)

No port forwarding, no static IP, HTTPS handled automatically. Free.

**Requirements:** A domain managed in Cloudflare (add your domain to Cloudflare, update nameservers at your registrar).

#### A1 — Install cloudflared on the server

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

#### A2 — Authenticate cloudflared

```bash
cloudflared tunnel login
```

This opens a browser URL. Copy it to your Windows machine, log in with your Cloudflare account, and select your domain.

#### A3 — Create the tunnel

```bash
cloudflared tunnel create nexora-backend
```

Note the tunnel UUID in the output (e.g. `abc123-...`).

#### A4 — Create the tunnel config

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste this (replace `YOUR_TUNNEL_UUID` and `yourdomain.com`):

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

#### A5 — Create DNS records

```bash
cloudflared tunnel route dns nexora-backend api.yourdomain.com
cloudflared tunnel route dns nexora-backend n8n.yourdomain.com
```

#### A6 — Run the tunnel as a service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Verify it's running:
```bash
sudo systemctl status cloudflared
```

#### A7 — Test public URLs

```bash
curl https://api.yourdomain.com/health
```

Should return `{"status": "ok"}`.

---

### Option B — Port Forwarding + DuckDNS (No domain needed)

Use this if you don't have a domain. DuckDNS gives you a free subdomain like `nexora.duckdns.org`.

#### B1 — Set up DuckDNS

1. Go to [duckdns.org](https://www.duckdns.org), sign in with Google
2. Create a subdomain (e.g. `nexora-api`) — you get `nexora-api.duckdns.org`
3. Note your DuckDNS token

#### B2 — Auto-update your IP

```bash
sudo apt install -y cron

# Create update script
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Paste (replace YOUR_TOKEN and YOUR_SUBDOMAIN):
```bash
echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x ~/duckdns/duck.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh > /dev/null 2>&1") | crontab -
```

#### B3 — Open firewall on the server

```bash
sudo ufw allow ssh
sudo ufw allow 8000/tcp
sudo ufw allow 5678/tcp
sudo ufw enable
```

#### B4 — Port forward on your router

1. Log into your router (usually `192.168.1.1`)
2. Find **Port Forwarding** settings
3. Add two rules:
   - External port `8000` → laptop's local IP → internal port `8000`
   - External port `5678` → laptop's local IP → internal port `5678`

Test:
```bash
curl http://nexora-api.duckdns.org:8000/health
```

> **Note:** Option B uses HTTP (no SSL). WhatsApp requires HTTPS webhooks. You'll need to either add Certbot + Nginx (see Part 7) or use Option A.

---

## Part 6 — Update Vercel + WhatsApp

Once the backend has a public URL, update:

**Vercel frontend:**
1. Go to vercel.com → your Nexora project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com` (or your DuckDNS URL)
3. Redeploy: Vercel → Deployments → Redeploy latest

**WhatsApp webhook (Meta):**
1. Go to developers.facebook.com → your app → WhatsApp → Configuration
2. Update Callback URL to: `https://api.yourdomain.com/webhooks/whatsapp`
   (or the per-tenant URL: `https://api.yourdomain.com/webhooks/whatsapp/{tenant_id}`)
3. Update Verify Token to match `WEBHOOK_SECRET` in your `.env`

---

## Part 7 — (Optional) Add HTTPS with Nginx + Certbot

Use this if you chose Option B and need HTTPS for WhatsApp webhooks.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy Nginx config (replace domains in the file first)
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Edit the domain placeholders
sudo nano /etc/nginx/nginx.conf
# Replace YOUR_API_DOMAIN and YOUR_N8N_DOMAIN

# Test and reload
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx

# Get SSL certificates
sudo certbot --nginx -d api.yourdomain.com -d n8n.yourdomain.com

# Certbot auto-renews every 90 days — verify the cron is active
sudo systemctl status certbot.timer
```

---

## Part 8 — Keeping the Server Running

Docker Compose services are configured with `restart: unless-stopped`. If the laptop reboots, Docker itself needs to start automatically:

```bash
sudo systemctl enable docker
```

That's it — Docker starts on boot, and your containers restart automatically with it.

---

## Part 9 — Updating the Deployment

When code changes are pushed to GitHub, run on the server:

```bash
cd ~/nexora
bash deploy.sh
```

This script:
1. Pulls latest code from GitHub
2. Rebuilds the backend Docker image
3. Restarts services with zero-downtime
4. Waits for the health check to pass
5. Shows the final container status

---

## Troubleshooting

### Backend won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
```
Most common cause: `.env` is missing or `DB_PASSWORD` doesn't match between `backend` and `postgres` services.

### Database connection error
```bash
# Check postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Connect manually to verify
docker compose -f docker-compose.prod.yml exec postgres psql -U nexora -d nexora -c "\dt"
```

### Port already in use
```bash
sudo lsof -i :8000
sudo lsof -i :5678
```
Kill the conflicting process or stop any old Docker containers:
```bash
docker ps -a
docker compose -f docker/docker-compose.yml down   # stop dev stack if running
```

### Cloudflare Tunnel not routing
```bash
sudo journalctl -u cloudflared -f
```
Common fix: DNS records take a few minutes to propagate. Wait 2 minutes and retry.

### Rebuilding from scratch (nuclear option)
```bash
docker compose -f docker-compose.prod.yml down -v   # WARNING: deletes all data
docker compose -f docker-compose.prod.yml up -d --build
```
This deletes the database. Only use if you want a completely clean slate.
