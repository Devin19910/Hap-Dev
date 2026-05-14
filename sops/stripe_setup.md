# Stripe Billing Setup SOP
### Step-by-step guide to activating self-service billing on Nexora

---

## OVERVIEW

When Stripe is configured, tenants can upgrade their plan directly from the dashboard
without you doing anything manually. They click "Upgrade", pay on Stripe's hosted
checkout page, and their plan upgrades automatically.

**What Stripe handles:**
- Collecting card payments (you never touch card data)
- Recurring monthly billing
- Failed payment retries
- Cancellations and refunds
- Invoices and receipts (sent automatically by Stripe)

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

You need to create one product per plan in Stripe.

### Basic Plan ($29/month)
1. Stripe Dashboard → **Product catalog** → **+ Add product**
2. Fill in:
   - **Name:** Nexora Basic
   - **Description:** 500 AI replies/month, CRM sync, Google Calendar
   - **Pricing model:** Standard pricing
   - **Price:** `29.00` USD → **Monthly** (recurring)
3. Click **Save product**
4. Copy the **Price ID** — it looks like `price_1ABC...` — save it somewhere

### Pro Plan ($99/month)
1. **+ Add product** again
2. Fill in:
   - **Name:** Nexora Pro
   - **Description:** 5,000 AI replies/month, custom AI personality, priority support
   - **Price:** `99.00` USD → Monthly
3. Save and copy the **Price ID**

### Business Plan ($199/month)
1. **+ Add product** again
2. Fill in:
   - **Name:** Nexora Business
   - **Description:** Unlimited AI replies + AI calling agent (Vapi)
   - **Price:** `199.00` USD → Monthly
3. Save and copy the **Price ID**

You should now have 3 price IDs. Write them here:
```
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
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

## STEP 5 — Enable Customer Portal

The Customer Portal lets tenants manage or cancel their subscription themselves.

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. Turn on:
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update payment methods
   - ✅ Show billing history
3. Under **Business information** → add your business name (Nexora)
4. Click **Save**

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
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
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
3. Click **Basic — $29/mo**
4. You should be redirected to Stripe's hosted checkout page
5. Enter test card: `4242 4242 4242 4242` · Expiry: `12/29` · CVC: `123`
6. Click **Pay**
7. You should be redirected back to the dashboard with `?billing=success`
8. Refresh the Settings tab — plan should now show **Basic**

### 8.2 — Verify webhook fired
1. Stripe Dashboard → **Developers** → **Webhooks** → your endpoint
2. Click on it → **Recent deliveries**
3. You should see a `checkout.session.completed` event with status **200**

### 8.3 — Test the billing portal
1. Still logged in as the test tenant → Settings → **Manage billing / cancel**
2. Stripe Customer Portal opens
3. You can see the subscription, update the card, or cancel

### 8.4 — Test cancellation
1. In the portal, cancel the subscription
2. Stripe fires `customer.subscription.deleted`
3. Backend downgrades the tenant to the Free plan automatically
4. Check the Settings tab — plan should show **Free**

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

### "No billing account found" on portal
The tenant hasn't completed a checkout yet — they don't have a `stripe_customer_id`. They need to do at least one upgrade first.

---

## PRICE IDs REFERENCE

Fill this in once you've created the products:

| Plan | Monthly Price | Price ID |
|---|---|---|
| Basic | $29/mo | `price_____________` |
| Pro | $99/mo | `price_____________` |
| Business | $199/mo | `price_____________` |

---

*Last updated: May 2026*
