# SOP: Deployment Process

**Who does this:** Owner (US) for backend; Operator (India) for frontend  
**When:** After any code change is merged

## Backend Deployment (Docker)

1. SSH into the server (or open WSL on the local machine)
2. Navigate to the project folder
3. Pull the latest code: `git pull`
4. Rebuild and restart: `cd docker && docker compose up --build -d`
5. Check logs: `docker compose logs -f backend`
6. Confirm health: visit `http://<server-ip>:8000/health`

## Frontend Deployment (Vercel)

1. Push changes to the `main` branch on GitHub
2. Vercel auto-deploys — watch the build at vercel.com/dashboard
3. Once live, open the Vercel URL and confirm the landing page loads

## Rollback
- Backend: `git checkout <previous-commit>` then `docker compose up --build -d`
- Frontend: In Vercel dashboard, click the previous deployment and click "Promote to Production"

## Environment Variables
- Backend: stored in `.env` file on the server (never commit this file)
- Frontend: set in Vercel dashboard under Project > Settings > Environment Variables
