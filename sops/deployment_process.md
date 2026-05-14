# SOP: Deployment Process

See the full guide: **`sops/server_deployment.md`**

Quick reference:

```bash
# Update production backend (run on the home server)
cd ~/nexora && bash deploy.sh

# Local dev only
cd docker && docker compose up -d
```

Frontend deploys automatically when you push to GitHub main (Vercel).
