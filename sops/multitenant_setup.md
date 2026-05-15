# SOP: SaaS Multi-Tenant Setup

## What This Does
Turns the platform into a true multi-tenant SaaS product. Each business (tenant) gets:
- Their own isolated data (contacts, conversations, appointments)
- Their own admin login with a scoped dashboard
- Their own WhatsApp, HubSpot, Zoho, and Google Calendar credentials
- A free-tier subscription (50 AI requests/month) that you can upgrade
- A self-service registration page so clients can sign up without your involvement

Platform admins (you and your cousin) see everything. Tenant admins only see their own data.

---

## How the Two User Types Work

| | Platform Admin | Tenant Admin |
|---|---|---|
| **Who** | Owner / Cousin (you) | Client's business owner |
| **tenant_id in DB** | `null` | set to their `client.id` |
| **Role** | `owner` or `operator` | `tenant_owner` or `tenant_operator` |
| **Dashboard tabs visible** | All (Clients, Tenants, Team included) | Overview, WhatsApp, Contacts, Appointments, Settings only |
| **Data access** | All tenants | Own tenant only |

---

## Part 1 — Registering a New Tenant

### Option A — Client registers themselves (self-service)

1. Send the client your registration URL:
   ```
   https://your-frontend-domain.vercel.app/register
   ```
2. They fill in: business name, business type, email, password
3. On submit:
   - A `Client` (tenant) record is created in the database
   - A free `Subscription` (50 AI requests/month) is created
   - An `AdminUser` with role `tenant_owner` is created and linked to the client
   - They are logged in immediately and land on their dashboard
4. No further action needed from your side — the account is live

### Option B — You create the tenant manually (as platform admin)

Use the Tenants tab in your platform admin dashboard, or via the API:

```bash
# 1. Register the tenant (no auth required — this is a public endpoint)
curl -X POST http://localhost:8000/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Sunshine Salon",
    "email": "owner@sunshinesalon.com",
    "password": "SecurePass123",
    "business_type": "salon"
  }'

# The response includes access_token — hand it to the client, or
# tell them to log in at /dashboard with their email + password
```

Valid `business_type` values: `general`, `salon`, `clinic`, `gym`, `immigration`, `trucking`, `restaurant`, `other`

---

## Part 2 — Configuring Per-Tenant Credentials

Each tenant can configure their own integrations from their **Settings** tab in the dashboard. You can also update settings on their behalf from the platform admin dashboard (Tenants tab → click a tenant).

### 2.1 WhatsApp (Meta Cloud API)

The tenant needs their own Meta app credentials. See `whatsapp_setup.md` for how to get these.

In the Settings tab, they fill in:
- **Phone Number ID** — from Meta App dashboard
- **Access Token** — permanent system user token
- **Verify Token** — any secret string they choose
- **Business Name** — displayed in webhook logs

Their webhook URL to register in Meta:
```
https://your-backend-domain/webhooks/whatsapp/{tenant_id}
```
Get the `tenant_id` from the Tenants tab (it is the UUID in the ID column) or from the API:
```bash
curl -H "Authorization: Bearer PLATFORM_ADMIN_JWT" \
  http://localhost:8000/tenants | python3 -m json.tool
```

> The global webhook URL `/webhooks/whatsapp` (no tenant_id) still works for
> single-tenant setups or direct platform use.

### 2.2 HubSpot

In the Settings tab → HubSpot API Key field, paste the Private App token.
See `crm_setup.md` → Part 2 for how to generate it.

If left blank, the platform falls back to the global `HUBSPOT_API_KEY` in `.env`.

### 2.3 Zoho CRM

In the Settings tab, fill in:
- **Zoho Client ID**
- **Zoho Client Secret**
- **Zoho Refresh Token**

See `crm_setup.md` → Part 3 for how to generate these.

If left blank, falls back to global Zoho credentials in `.env`.

### 2.4 Google Calendar

In the Settings tab, fill in:
- **Google Client ID**
- **Google Client Secret**
- **Google Refresh Token**
- **Calendar ID** (leave as `primary` to use their default calendar)
- **Timezone** (e.g. `Asia/Kolkata`, `America/New_York`)

See `appointment_booking_setup.md` → Part 1 for how to generate OAuth credentials.

If left blank, falls back to global Google credentials in `.env`.

### 2.5 AI Provider

In the Settings tab, select: `claude`, `openai`, or `gemini`.
If left blank, falls back to `DEFAULT_AI_PROVIDER` in `.env` (default: `claude`).

---

## Part 3 — Managing Tenants (Platform Admin)

Open the **Tenants** tab in the platform admin dashboard. You will see a table of all registered tenants with:
- Name, email, slug, business type
- Status (active / suspended)
- Which integrations are configured (WhatsApp, HubSpot, Zoho, Google Calendar)
- Created date

### Suspend a tenant
Click **Suspend** next to the tenant. Their `is_active` flag is set to `false` and status becomes `suspended`. Their admin login still works but their API key will be rejected by AI/webhook routes.

Via API:
```bash
curl -X POST http://localhost:8000/tenants/{tenant_id}/suspend \
  -H "Authorization: Bearer PLATFORM_ADMIN_JWT"
```

### Reactivate a tenant
Click **Activate** in the Tenants tab, or:
```bash
curl -X POST http://localhost:8000/tenants/{tenant_id}/activate \
  -H "Authorization: Bearer PLATFORM_ADMIN_JWT"
```

---

## Part 4 — Subscription Tiers and Usage

Every new tenant starts on the **free tier** (50 AI requests/month). The platform tracks usage per tenant in the `subscriptions` table.

| Tier | Monthly Limit |
|---|---|
| `free` | 50 requests |
| `basic` | 500 requests |
| `pro` | 5,000 requests |

### Checking a tenant's usage

Via API:
```bash
curl -H "Authorization: Bearer PLATFORM_ADMIN_JWT" \
  http://localhost:8000/tenants/{tenant_id}/usage
```

Response:
```json
{
  "tier": "free",
  "monthly_limit": 50,
  "requests_used": 12,
  "remaining": 38,
  "is_active": true,
  "usage_pct": 24.0
}
```

### Upgrading a tenant's tier

**Self-service (recommended):** The tenant logs into their dashboard → Settings → clicks an upgrade button → pays with card in-app. Their plan updates automatically when payment succeeds.

**Manual override** (if needed — e.g. you're gifting a plan or fixing a billing error):
```bash
docker compose -f docker-compose.prod.yml exec db psql -U nexora -d ai_automation -c \
  "UPDATE subscriptions SET tier='basic', monthly_limit=500 WHERE client_id='TENANT_UUID';"
```

Available tier values: `free` (50/mo), `basic` (500/mo), `pro` (5000/mo), `business` (99999/mo)

---

## Part 5 — Platform Admin Team Management

Use the **Team** tab (visible only to platform admins) to create additional platform admin accounts.

| Role | Access |
|---|---|
| `owner` | Full access, can create/list users |
| `operator` | Full access, cannot manage users |

Creating a new team member:
1. Open **Team** tab → fill in email, name, password, role → click **Create**
2. Share the credentials. They log in at `/dashboard` with email + password.
3. Their `tenant_id` will be `null` so they get the full platform admin dashboard.

Via API:
```bash
curl -X POST http://localhost:8000/auth/users \
  -H "Authorization: Bearer OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cousin@yourcompany.com",
    "password": "SecurePass123",
    "first_name": "Harpreet",
    "last_name": "Singh",
    "role": "operator"
  }'
```

---

## Part 6 — Client Onboarding Checklist

Use this for every new client after they register:

- [ ] Confirm they received the registration confirmation (they are auto-logged in)
- [ ] Share this guide with them: `sops/whatsapp_setup.md`
- [ ] Ask them to fill in Settings → WhatsApp credentials
- [ ] Give them their webhook URL: `https://your-backend/webhooks/whatsapp/{tenant_id}`
- [ ] Help them register it in their Meta App (Verify Token must match what they entered in Settings)
- [ ] Send a test WhatsApp message to confirm the AI replies
- [ ] Check the Tenants tab to confirm their WhatsApp shows ✓
- [ ] Optional: help them connect HubSpot, Zoho, or Google Calendar
- [ ] Note their tier — free plan allows 50 AI requests/month; upgrade if needed

---

## Troubleshooting

### "Email already registered" on /register
The email exists in either the `admin_users` table or the `clients` table. Check:
```bash
docker compose exec db psql -U postgres -d ai_automation -c \
  "SELECT email FROM admin_users WHERE email='their@email.com';"
```
If it exists from a failed previous attempt, delete it and let them re-register:
```sql
DELETE FROM admin_users WHERE email = 'their@email.com';
DELETE FROM clients WHERE email = 'their@email.com';
```

### Tenant sees platform admin tabs
Their `tenant_id` in `admin_users` is `null`. Check:
```sql
SELECT id, email, role, tenant_id FROM admin_users WHERE email = 'their@email.com';
```
Fix by setting the correct tenant_id:
```sql
UPDATE admin_users SET tenant_id = 'CORRECT_CLIENT_UUID'
WHERE email = 'their@email.com';
```

### WhatsApp messages not routing to the right tenant
Make sure the client registered their webhook URL as:
```
https://your-backend/webhooks/whatsapp/{their_tenant_id}
```
Not the global `/webhooks/whatsapp`. Their `tenant_id` is the UUID in the Tenants tab.

### Settings tab saves but nothing changes
The `PUT /tenants/{id}/config` endpoint only updates fields that are explicitly sent (non-null). If a field looks unchanged, the frontend may have sent an empty string instead of omitting it. Check the network tab in the browser and look at the request body.

### AI requests still using global API keys instead of per-tenant
Per-tenant credentials are only used if the WhatsApp message comes in on the per-tenant route (`/webhooks/whatsapp/{tenant_id}`). The global `/webhooks/whatsapp` route uses global `.env` credentials. Confirm the client's Meta webhook URL includes their `tenant_id`.
