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
    pm = sc.payment_methods.attach(payment_method_id, {"customer": customer_id})
    real_pm_id = pm.id

    sc.customers.update(customer_id, {
        "invoice_settings": {"default_payment_method": real_pm_id}
    })

    # Create the subscription, explicitly setting the payment method
    sub = sc.subscriptions.create({
        "customer": customer_id,
        "items": [{"price": price_id}],
        "default_payment_method": real_pm_id,
        "payment_behavior": "default_incomplete",
        "payment_settings": {"save_default_payment_method": "on_subscription"},
        "metadata": {"tier": tier},
    })

    status = sub.status

    # Retrieve client_secret for SCA if subscription is incomplete
    client_secret = None
    if status == "incomplete":
        try:
            invoice = sc.invoices.retrieve(sub.latest_invoice, {"expand": ["payment_intent"]})
            pi = getattr(invoice, "payment_intent", None)
            if pi:
                client_secret = pi.client_secret
        except Exception:
            pass

    return {
        "subscription_id": sub.id,
        "status": status,
        "client_secret": client_secret,
    }


def cancel_subscription(stripe_customer_id: str) -> None:
    """Cancels the active subscription for a customer at period end."""
    sc = _client()
    subs = sc.subscriptions.list({"customer": stripe_customer_id, "status": "active", "limit": 1})
    for sub in subs.data:
        sc.subscriptions.update(sub.id, {"cancel_at_period_end": True})


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )
