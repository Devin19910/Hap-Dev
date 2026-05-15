# Stripe Billing Setup SOP
### Step-by-step guide to activating self-service billing on Nexora

---

## OVERVIEW

When Stripe is configured, tenants can upgrade their plan directly from the dashboard
without you doing anything manually. They click "Upgrade", enter their card in the
**in-app checkout modal** (no redirect to Stripe's website), and their plan upgrades
automatically.

**What Stripe handles:**
- Collecting card payments (you never touch card data)
- Recurring monthly/yearly billing
- Failed payment retries
- Cancellations and refunds

**What Nexora handles in-app (no Stripe redirect):**
- In-app card form (Stripe Elements embedded in the dashboard)
- Subscription management (next renewal date, cancel, reactivate)
- Branded Nexora PDF invoice downloads
- Invoice history with payment status

**Time to complete:** ~30 minutes

---

## STEP 1 — Create a Stripe Account

1. Go to **https://stripe.com** → click **Start now**
2. Sign up with your business email
3. Complete identity verification (takes 5-10 minutes — need SSN or EIN)
4. Once approved, you'll land on the Stripe Dashboard

> **Test mode vs Live mode:** The toggle in the top-left says "Test mode" by default.
> Use Test mode first to verify everything works, then switch to Live mode for real payments.
> Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## STEP 2 — Create Your 3 Products

You need to create **one product per plan**. Each product gets **two prices**: monthly and annual.

> **Why two prices per product?** The landing page offers a yearly toggle (2 months free ≈ 17% off). Stripe tracks monthly and annual as separate price IDs on the same product.

### Basic Plan
1. Stripe Dashboard → **Product catalog** → **+ Add product**
2. Fill in:
   - **Name:** Nexora Basic
   - **Description:** 500 AI replies/month, CRM sync, Google Calendar
3. Add the **monthly** price:
   - **Pricing model:** Standard pricing
   - **Price:** `29.00` USD → **Monthly** (recurring)
4. Click **+ Add another price** on the same product:
   - **Price:** `24.00` USD → **Yearly** (recurring) — ($288/year, saves $60)
5. **Save product**
6. Copy **both Price IDs** — the monthly one (`price_xxx`) and the yearly one (`price_yyy`)

### Pro Plan
1. **+ Add product**
   - **Name:** Nexora Pro
   - **Description:** 5,000 AI replies/month, custom AI personality, priority support
2. Monthly price: `99.00` USD → Monthly
3. Yearly price: `83.00` USD → Yearly ($996/year, saves $192)
4. Save and copy both Price IDs

### Business Plan
1. **+ Add product**
   - **Name:** Nexora Business
   - **Description:** Unlimited AI replies + AI calling agent (Vapi)
2. Monthly price: `199.00` USD → Monthly
3. Yearly price: `166.00` USD → Yearly ($1,992/year, saves $396)
4. Save and copy both Price IDs

You should now have **6 price IDs**. Write them here:
```
# Monthly
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

# Yearly (2 months free)
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

---

## STEP 3 — Get Your API Keys

1. Stripe Dashboard → **Developers** (top right) → **API keys**
2. Copy:
   - **Publishable key** — starts with `pk_test_` (test) or `pk_live_` (live) — not needed for backend
   - **Secret key** — starts with `sk_test_` or `sk_live_` — **keep this secret**

Write it here:
```
STRIPE_SECRET_KEY=sk_test_...
```

> ⚠️ Never share or commit your secret key. It goes in `.env` on the server only.

---

## STEP 4 — Set Up the Webhook

Stripe needs to notify your backend when a payment succeeds or a subscription changes.

1. Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**
2. Fill in:
   - **Endpoint URL:** `https://nexora.cmdfleet.com/webhooks/stripe`
   - **Listen to:** Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. Click **Add endpoint**
4. Click on the endpoint you just created → **Signing secret** → **Reveal** → copy it

Write it here:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## STEP 5 — Add Publishable Key to Vercel

The frontend needs the Stripe publishable key to load the in-app card form.

1. Stripe Dashboard → **Developers** → **API keys** → copy the **Publishable key** (`pk_test_...`)
2. Go to **https://vercel.com** → your project → **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value:** `pk_test_...`
   - **Environment:** Production, Preview, Development
4. Click **Save** → then **Deployments** → **Redeploy** the latest deployment

> **Note:** The Customer Portal (Stripe's hosted management page) is NOT used. Nexora has
> its own in-app billing management. You do NOT need to configure it.

---

## STEP 6 — Update the Server .env

SSH into the server (or type directly on the screen):

```bash
nano ~/nexora/.env
```

Add/update these lines at the bottom:

```env
# Stripe billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Monthly prices
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
# Yearly prices (2 months free)
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
APP_URL=https://hap-dev.vercel.app
```

Save and exit (`Ctrl+X` → `Y` → `Enter`).

---

## STEP 7 — Deploy to Apply Changes

```bash
cd ~/nexora && bash deploy.sh
```

This rebuilds the backend with the new Stripe config and runs the migration
that adds `stripe_customer_id` to the clients table.

Verify it worked:
```bash
curl https://nexora.cmdfleet.com/health
```

---

## STEP 8 — Test the Full Flow

### 8.1 — Test upgrade from dashboard
1. Open **https://hap-dev.vercel.app/login** → log in as a test tenant
2. Go to **Settings** tab
3. Click **Basic — $29/mo** (or choose Yearly for the discounted rate)
4. An in-app modal appears with a card entry form (no redirect to Stripe)
5. Enter test card: `4242 4242 4242 4242` · Expiry: `12/29` · CVC: `123`
6. Click **Subscribe**
7. Modal closes — plan badge immediately updates to **BASIC**

### 8.2 — Verify webhook fired
1. Stripe Dashboard → **Developers** → **Webhooks** → your endpoint
2. Click on it → **Recent deliveries**
3. You should see a `customer.subscription.updated` event with status **200**

### 8.3 — Test subscription management
1. Still in Settings tab → scroll down to **Subscription Management**
2. You should see: next renewal date, amount per month/year
3. Click **Cancel subscription** → confirm → button changes to Reactivate
4. Renewal card now shows amber warning with the cancellation date
5. Click **Reactivate subscription** → subscription resumes normally

### 8.4 — Test invoice download
1. Scroll down to **Invoice History**
2. You should see at least one paid invoice listed
3. Click **Download PDF** → a branded Nexora PDF downloads to your computer
4. PDF should show: Nexora header, billed-to info, invoice number, line items, totals

### 8.5 — Test automatic downgrade on cancellation
1. In Stripe Dashboard → **Customers** → find your test customer → **Subscriptions** → **Cancel immediately**
2. Stripe fires `customer.subscription.deleted`
3. Backend automatically downgrades the tenant to Free
4. Check Settings tab — plan badge should now show **FREE**

---

## STEP 9 — Go Live (When Ready)

When you've tested everything in test mode:

1. Stripe Dashboard → toggle **Test mode → Live mode** (top left)
2. Repeat Steps 2-4 in **Live mode** (create live products, get live keys, add live webhook)
3. Update `.env` on the server with the `sk_live_...` and `whsec_live_...` values
4. Run `bash deploy.sh` again

> ⚠️ Live mode uses real money. Only switch after test mode is fully working.

---

## TROUBLESHOOTING

### "Stripe is not configured on this server yet"
The `STRIPE_SECRET_KEY` is missing from `.env`. Check Step 6.

### Checkout redirect fails / blank page
The `APP_URL` in `.env` doesn't match your Vercel URL. Update it to exactly `https://hap-dev.vercel.app`.

### Webhook shows "400 Invalid signature"
The `STRIPE_WEBHOOK_SECRET` is wrong. Re-copy it from Stripe Dashboard → Webhooks → your endpoint → Signing secret.

### Plan doesn't upgrade after payment
1. Check Stripe → Webhooks → Recent deliveries — did the webhook fire?
2. If it fired but returned an error, check backend logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend --tail=50
   ```
3. Make sure the `metadata.client_id` and `metadata.tier` are in the Checkout session.

### "No billing account found" on subscription management
The tenant hasn't completed a checkout yet — no `stripe_customer_id` on file. They need to upgrade from the Free plan first.

### Subscription Management shows "No active Stripe subscription found"
The tenant has a paid tier in the DB but no active Stripe subscription. This can happen if the subscription was cancelled in the Stripe Dashboard directly. The DB tier will be fixed on the next webhook event.

### Invoice History is empty
Invoices only appear after a successful payment. In Stripe test mode, invoices are generated immediately when a subscription is created with card `4242 4242 4242 4242`. If no invoices appear, check the backend logs for errors from `GET /billing/invoices`.

### PDF download shows blank or fails
Check backend logs: `docker compose -f docker-compose.prod.yml logs backend --tail=30`. The most common cause is the `reportlab` library not installed — make sure `requirements.txt` includes `reportlab` and run `bash deploy.sh` to rebuild.

---

## PRICE IDs REFERENCE

Fill this in once you've created the products:

| Plan | Billing | Price | Price ID |
|---|---|---|---|
| Basic | Monthly | $29/mo | `price_____________` |
| Basic | Yearly | $24/mo ($288/yr) | `price_____________` |
| Pro | Monthly | $99/mo | `price_____________` |
| Pro | Yearly | $83/mo ($996/yr) | `price_____________` |
| Business | Monthly | $199/mo | `price_____________` |
| Business | Yearly | $166/mo ($1,992/yr) | `price_____________` |

---

*Last updated: May 2026*
