# SOP: API Key Management

**Who does this:** Owner (US)  
**When:** Setting up, rotating, or auditing API keys

## Keys We Manage

| Key | Where to get it | Where it lives | Rotation frequency |
|---|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | `.env` | When compromised |
| `CLAUDE_API_KEY` | console.anthropic.com | `.env` | When compromised |
| `GEMINI_API_KEY` | aistudio.google.com | `.env` | When compromised |
| `API_SECRET_KEY` | You set this | `.env` | Every 6 months |
| `WEBHOOK_SECRET` | You set this | `.env` | Every 6 months |

## Rules
1. NEVER commit real API keys to git — always use `.env`
2. NEVER share API keys in Slack, WhatsApp, or email — use a password manager
3. The India operator should NOT have access to AI provider keys directly
4. Each client gets their own generated `api_key` (UUID) — they never see our internal keys

## Rotating a Key
1. Generate the new key at the provider dashboard
2. Update `.env` on the server
3. Restart the backend: `cd docker && docker compose restart backend`
4. Test that the API is still working: `curl http://localhost:8000/health`
5. Delete the old key from the provider dashboard

## If a Key is Compromised
1. **Immediately** revoke it at the provider dashboard
2. Generate a new key
3. Update `.env` and restart
4. Check logs for unauthorized usage: `docker logs docker-backend-1 | grep "401\|403"`
5. Document the incident in `memory/lessons/`
