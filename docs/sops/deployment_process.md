# SOP: Deployment Process

**Who does this:** Owner (US) for backend; Operator (India) for frontend
**When:** After any code change is merged

## Backend Deployment (Production — Home Server)

The simplest way — run the deploy script:

```bash
cd ~/nexora
bash deploy.sh
```

This does: `git pull` → `docker compose build backend` → `docker compose up -d` → health check.

Manual steps if needed:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d
curl http://localhost:8000/health
```

For the full server setup guide, see `sops/server_deployment.md`.

## Local Dev (not for production)

```bash
cd docker && docker compose up -d
```

Uses hot-reload and source volume mount. Do NOT use this file for production.

## Frontend Deployment (Vercel)

1. Push changes to the `main` branch on GitHub
2. Vercel auto-deploys — watch the build at vercel.com/dashboard
3. Once live, open the Vercel URL and confirm the landing page loads

Key Vercel env var to set: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

## Rollback

- **Backend:** `git checkout <previous-commit>` then `bash deploy.sh`
- **Frontend:** Vercel dashboard → Deployments → select previous build → Promote to Production

## Environment Variables

- **Backend:** `.env` file on the server — never commit this file
- **Frontend:** Vercel dashboard → Project → Settings → Environment Variables
