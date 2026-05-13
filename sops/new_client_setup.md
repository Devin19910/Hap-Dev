# SOP: Full New Client Setup (End-to-End)

**Who does this:** Operator (India)  
**Time required:** ~15 minutes  
**When:** Every time a new paying client signs up

## Step 1 — Gather Client Information
Collect from the client:
- [ ] Business name
- [ ] Contact email
- [ ] Chosen plan (Free / Basic / Pro)
- [ ] Business type (salon, clinic, gym, etc.)
- [ ] WhatsApp number (if using WhatsApp AI)

## Step 2 — Create Client in Dashboard
1. Open dashboard: http://your-deployment-url/dashboard
2. Enter your API secret key to log in
3. In sidebar under "Add Client", fill in Name, Email, Tier
4. Click **Create**
5. Copy the generated API key — save it securely

## Step 3 — Send Welcome Package
1. Email the client their API key (use the welcome email template in Notion)
2. Share the onboarding checklist (Notion > Client Onboarding > Template)
3. Add client to the "Active Clients" table in Notion

## Step 4 — Set Up Their Automation (if applicable)
1. Follow `sops/n8n_workflow_setup.md` to create their automation workflow
2. Test with a sample message/trigger
3. Confirm with client that automations are working

## Step 5 — Verify Everything
- [ ] Client appears in dashboard
- [ ] Subscription tier is correct
- [ ] API key delivered to client
- [ ] Workflow tested and active (if applicable)
- [ ] Client added to Notion

## Troubleshooting
- "Email already registered" → client exists, search in dashboard first
- Client not receiving emails → check spam, verify email address
- Workflow not triggering → follow `sops/n8n_workflow_setup.md` troubleshooting section
