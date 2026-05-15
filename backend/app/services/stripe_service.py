"""
Stripe billing service — Checkout sessions and Customer Portal.
All plan → price ID mappings come from environment variables so they
can be set per-environment without code changes.
"""
import stripe
from ..utils.config import settings

PRICE_MAP = {
    ("basic",    "monthly"): lambda: settings.stripe_price_basic,
    ("pro",      "monthly"): lambda: settings.stripe_price_pro,
    ("business", "monthly"): lambda: settings.stripe_price_business,
    ("basic",    "yearly"):  lambda: settings.stripe_price_basic_yearly,
    ("pro",      "yearly"):  lambda: settings.stripe_price_pro_yearly,
    ("business", "yearly"):  lambda: settings.stripe_price_business_yearly,
}


def _client() -> stripe.StripeClient:
    return stripe.StripeClient(settings.stripe_secret_key)


def create_checkout_session(
    client_id: str,
    tier: str,
    customer_email: str,
    stripe_customer_id: str = "",
    billing_period: str = "monthly",
) -> str:
    """
    Creates a Stripe Checkout session for the given tier and billing period.
    Returns the hosted checkout URL to redirect the user to.
    """
    key = (tier, billing_period)
    price_fn = PRICE_MAP.get(key)
    if not price_fn:
        raise ValueError(f"Unknown tier/period combination: {tier}/{billing_period}")
    price_id = price_fn()
    if not price_id:
        env_key = f"STRIPE_PRICE_{tier.upper()}{'_YEARLY' if billing_period == 'yearly' else ''}"
        raise ValueError(f"{env_key} is not set in .env")

    params: dict = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": f"{settings.app_url}/dashboard?billing=success&tier={tier}",
        "cancel_url":  f"{settings.app_url}/dashboard?billing=cancelled",
        "metadata": {"client_id": client_id, "tier": tier},
        "allow_promotion_codes": True,
    }

    if stripe_customer_id:
        params["customer"] = stripe_customer_id
    else:
        params["customer_email"] = customer_email

    session = _client().checkout.sessions.create(params)
    return session.url


def create_portal_session(stripe_customer_id: str) -> str:
    """
    Opens the Stripe Customer Portal so the tenant can manage or cancel their subscription.
    Returns the portal URL.
    """
    session = _client().billing_portal.sessions.create({
        "customer": stripe_customer_id,
        "return_url": f"{settings.app_url}/dashboard",
    })
    return session.url


def get_or_create_customer(email: str, name: str) -> str:
    """Finds an existing Stripe customer by email or creates a new one. Returns customer ID."""
    existing = _client().customers.list({"email": email, "limit": 1})
    if existing.data:
        return existing.data[0].id
    customer = _client().customers.create({"email": email, "name": name})
    return customer.id


def create_subscription(
    customer_id: str,
    payment_method_id: str,
    tier: str,
    billing_period: str = "monthly",
) -> dict:
    """
    Attaches a PaymentMethod to the customer and creates a subscription directly.
    Returns {"subscription_id": ..., "status": ..., "client_secret": ...}.
    The client_secret is only set when SCA (3D Secure) confirmation is required.
    """
    key = (tier, billing_period)
    price_fn = PRICE_MAP.get(key)
    if not price_fn:
        raise ValueError(f"Unknown tier/period: {tier}/{billing_period}")
    price_id = price_fn()
    if not price_id:
        raise ValueError(f"Price ID not configured for {tier}/{billing_period}")

    sc = _client()

    # Attach payment method to customer — capture the returned object for the real ID
    pm = sc.v1.payment_methods.attach(payment_method_id, {"customer": customer_id})
    real_pm_id = pm.id

    sc.v1.customers.update(customer_id, {
        "invoice_settings": {"default_payment_method": real_pm_id}
    })

    # Create the subscription, explicitly setting the payment method
    sub = sc.v1.subscriptions.create({
        "customer": customer_id,
        "items": [{"price": price_id}],
        "default_payment_method": real_pm_id,
        "payment_behavior": "default_incomplete",
        "payment_settings": {"save_default_payment_method": "on_subscription"},
        "metadata": {"tier": tier},
    })

    # Pay the invoice immediately server-side (works for non-SCA cards like 4242)
    # For SCA cards, the pay() call will raise an error and we fall back to client_secret
    client_secret = None
    if sub.status == "incomplete" and sub.latest_invoice:
        try:
            sc.v1.invoices.pay(sub.latest_invoice, {"payment_method": real_pm_id})
            sub = sc.v1.subscriptions.retrieve(sub.id)  # refresh status
        except stripe.CardError:
            raise  # real card decline — propagate to caller
        except Exception:
            # SCA required or other — try to get confirmation secret for frontend
            try:
                inv = sc.v1.invoices.retrieve(sub.latest_invoice)
                cs = getattr(inv, "confirmation_secret", None)
                if cs:
                    client_secret = getattr(cs, "client_secret", None)
            except Exception:
                pass

    return {
        "subscription_id": sub.id,
        "status": sub.status,
        "client_secret": client_secret,
    }


def cancel_subscription(stripe_customer_id: str) -> None:
    """Cancels the active subscription for a customer at period end."""
    sc = _client()
    subs = sc.v1.subscriptions.list({"customer": stripe_customer_id, "status": "active", "limit": 1})
    for sub in subs.data:
        sc.v1.subscriptions.update(sub.id, {"cancel_at_period_end": True})


def reactivate_subscription(stripe_customer_id: str) -> None:
    """Re-enables a subscription that was set to cancel at period end."""
    sc = _client()
    subs = sc.v1.subscriptions.list({"customer": stripe_customer_id, "status": "active", "limit": 1})
    for sub in subs.data:
        if getattr(sub, "cancel_at_period_end", False):
            sc.v1.subscriptions.update(sub.id, {"cancel_at_period_end": False})


def _tier_from_price(price_id: str) -> str:
    mapping = {
        settings.stripe_price_basic:           "basic",
        settings.stripe_price_pro:             "pro",
        settings.stripe_price_business:        "business",
        settings.stripe_price_basic_yearly:    "basic",
        settings.stripe_price_pro_yearly:      "pro",
        settings.stripe_price_business_yearly: "business",
    }
    return mapping.get(price_id, "")


def get_active_subscription(stripe_customer_id: str) -> dict | None:
    """Returns the active subscription details for the customer, or None."""
    sc = _client()
    subs = sc.v1.subscriptions.list({"customer": stripe_customer_id, "status": "active", "limit": 1})
    if not subs.data:
        return None

    sub = subs.data[0]

    price_id = ""
    amount   = 0
    currency = "usd"
    interval = "month"
    items_obj = getattr(sub, "items", None)
    if items_obj:
        items_list = getattr(items_obj, "data", [])
        if items_list:
            price = getattr(items_list[0], "price", None)
            if price:
                price_id = getattr(price, "id", "")
                amount   = getattr(price, "unit_amount", 0) or 0
                currency = getattr(price, "currency", "usd")
                recurring = getattr(price, "recurring", None)
                if recurring:
                    interval = getattr(recurring, "interval", "month")

    return {
        "subscription_id":     sub.id,
        "status":              getattr(sub, "status", ""),
        "tier":                _tier_from_price(price_id),
        "price_id":            price_id,
        "amount":              amount,
        "currency":            currency,
        "interval":            interval,
        "current_period_end":  getattr(sub, "current_period_end", None),
        "cancel_at_period_end": getattr(sub, "cancel_at_period_end", False),
    }


def list_invoices(stripe_customer_id: str) -> list:
    """Returns the last 24 invoices for the customer."""
    sc = _client()
    invs = sc.v1.invoices.list({"customer": stripe_customer_id, "limit": 24})
    result = []
    for inv in invs.data:
        result.append({
            "id":          inv.id,
            "number":      getattr(inv, "number", None) or inv.id,
            "amount_paid": getattr(inv, "amount_paid", 0) or 0,
            "currency":    getattr(inv, "currency", "usd"),
            "status":      getattr(inv, "status", ""),
            "created":     getattr(inv, "created", 0),
            "period_start": getattr(inv, "period_start", None),
            "period_end":   getattr(inv, "period_end", None),
        })
    return result


def get_invoice(invoice_id: str, stripe_customer_id: str) -> dict:
    """Retrieves a single invoice and verifies it belongs to this customer."""
    sc = _client()
    inv = sc.v1.invoices.retrieve(invoice_id)

    customer = getattr(inv, "customer", None)
    customer_id = customer if isinstance(customer, str) else getattr(customer, "id", "")
    if customer_id != stripe_customer_id:
        raise ValueError("Invoice not found")

    lines = []
    lines_obj = getattr(inv, "lines", None)
    if lines_obj:
        for line in getattr(lines_obj, "data", []):
            period = getattr(line, "period", None)
            lines.append({
                "description": getattr(line, "description", "") or "Nexora Subscription",
                "amount":      getattr(line, "amount", 0) or 0,
                "currency":    getattr(line, "currency", "usd"),
                "period_start": getattr(period, "start", None) if period else None,
                "period_end":   getattr(period, "end", None)   if period else None,
            })

    return {
        "id":            inv.id,
        "number":        getattr(inv, "number", None) or inv.id,
        "amount_paid":   getattr(inv, "amount_paid", 0) or 0,
        "amount_due":    getattr(inv, "amount_due",  0) or 0,
        "currency":      getattr(inv, "currency", "usd"),
        "status":        getattr(inv, "status", ""),
        "created":       getattr(inv, "created", 0),
        "period_start":  getattr(inv, "period_start", None),
        "period_end":    getattr(inv, "period_end", None),
        "customer_email": getattr(inv, "customer_email", ""),
        "customer_name":  getattr(inv, "customer_name", ""),
        "lines":         lines,
        "subtotal":      getattr(inv, "subtotal", 0) or 0,
        "tax":           getattr(inv, "tax",      0) or 0,
        "total":         getattr(inv, "total",    0) or 0,
    }


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )
