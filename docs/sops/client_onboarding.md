# SOP: Client Onboarding

**Who does this:** India operator  
**When:** Every time a new paying client signs up

## Steps

1. Collect client name, email, and chosen plan (free / basic / pro)
2. Open the Operator Dashboard at your deployment URL
3. In the sidebar, fill in Name, Email, and select the Tier
4. Click **Create** — the system creates the client and assigns them an API key
5. Copy the API key shown and send it to the client via email
6. Add the client to Notion under "Active Clients" with their plan and start date
7. Send the welcome email template (see Notion > Templates > Welcome Email)

## Troubleshooting
- "Email already registered" → client exists, check Active Clients in Notion
- "Invalid tier" → only use: free, basic, pro (all lowercase)

## Notes
- Never share the internal API_SECRET_KEY with clients — they get their own client API key
- Free tier is 50 requests/month; upgrade via Dashboard > Subscriptions if they ask for more
