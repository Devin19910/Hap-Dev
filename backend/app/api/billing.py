"""
Stripe billing endpoints.

POST /billing/checkout  — create a Checkout session (returns redirect URL)
POST /billing/portal    — create a Customer Portal session (manage/cancel)
POST /webhooks/stripe   — Stripe webhook handler (no auth — verified by signature)
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.client import Client
from ..models.subscription import Subscription, TIERS
from ..services import stripe_service
from ..utils.auth import get_current_user
from ..utils.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["billing"])


class CheckoutRequest(BaseModel):
    tier: str            # basic | pro | business
    billing_period: str = "monthly"  # monthly | yearly


# ── Checkout ──────────────────────────────────────────────────────────────────

@router.post("/billing/checkout")
def create_checkout(
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if body.tier not in ("basic", "pro", "business"):
        raise HTTPException(400, "Invalid tier. Choose: basic, pro, business")
    if body.billing_period not in ("monthly", "yearly"):
        raise HTTPException(400, "Invalid billing_period. Choose: monthly, yearly")

    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe is not configured on this server yet.")

    client_id = current_user.tenant_id
    if not client_id:
        raise HTTPException(400, "Billing is only available for tenant accounts.")

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")

    # Ensure Stripe customer exists
    if not client.stripe_customer_id:
        customer_id = stripe_service.get_or_create_customer(client.email, client.name)
        client.stripe_customer_id = customer_id
        db.commit()

    try:
        url = stripe_service.create_checkout_session(
            client_id           = client_id,
            tier                = body.tier,
            customer_email      = client.email,
            stripe_customer_id  = client.stripe_customer_id,
            billing_period      = body.billing_period,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error("Stripe checkout error: %s", e)
        raise HTTPException(502, "Could not create checkout session")

    return {"url": url}


# ── Customer Portal ───────────────────────────────────────────────────────────

@router.post("/billing/portal")
def create_portal(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe is not configured on this server yet.")

    client_id = current_user.tenant_id
    if not client_id:
        raise HTTPException(400, "Billing is only available for tenant accounts.")

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client or not client.stripe_customer_id:
        raise HTTPException(404, "No billing account found. Complete a checkout first.")

    try:
        url = stripe_service.create_portal_session(client.stripe_customer_id)
    except Exception as e:
        logger.error("Stripe portal error: %s", e)
        raise HTTPException(502, "Could not open billing portal")

    return {"url": url}


# ── Stripe Webhook (public — verified by signature) ───────────────────────────

@router.post("/webhooks/stripe", status_code=200)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except Exception as e:
        logger.warning("Stripe webhook signature failed: %s", e)
        raise HTTPException(400, "Invalid signature")

    event_type = event["type"]
    data       = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data, db)

    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data, db)

    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data, db)

    return {"received": True}


# ── Webhook handlers ──────────────────────────────────────────────────────────

def _handle_checkout_completed(session: dict, db: Session):
    client_id = session.get("metadata", {}).get("client_id", "")
    tier      = session.get("metadata", {}).get("tier", "")
    if not client_id or tier not in TIERS:
        return

    # Save Stripe customer ID if we don't have it yet
    stripe_customer_id = session.get("customer", "")
    client = db.query(Client).filter(Client.id == client_id).first()
    if client and stripe_customer_id and not client.stripe_customer_id:
        client.stripe_customer_id = stripe_customer_id

    sub = db.query(Subscription).filter(Subscription.client_id == client_id).first()
    if sub:
        sub.tier          = tier
        sub.monthly_limit = TIERS[tier]
    db.commit()
    logger.info("Upgraded client %s to %s", client_id, tier)


def _handle_subscription_updated(subscription: dict, db: Session):
    stripe_customer_id = subscription.get("customer", "")
    if not stripe_customer_id:
        return

    client = db.query(Client).filter(Client.stripe_customer_id == stripe_customer_id).first()
    if not client:
        return

    # Derive tier from the active price ID
    price_id = ""
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")

    tier = _price_to_tier(price_id)
    if not tier:
        return

    sub = db.query(Subscription).filter(Subscription.client_id == client.id).first()
    if sub:
        sub.tier          = tier
        sub.monthly_limit = TIERS[tier]
        db.commit()
        logger.info("Updated client %s subscription to %s", client.id, tier)


def _handle_subscription_deleted(subscription: dict, db: Session):
    stripe_customer_id = subscription.get("customer", "")
    if not stripe_customer_id:
        return

    client = db.query(Client).filter(Client.stripe_customer_id == stripe_customer_id).first()
    if not client:
        return

    sub = db.query(Subscription).filter(Subscription.client_id == client.id).first()
    if sub:
        sub.tier          = "free"
        sub.monthly_limit = TIERS["free"]
        db.commit()
        logger.info("Downgraded client %s to free (subscription cancelled)", client.id)


def _price_to_tier(price_id: str) -> str:
    mapping = {
        settings.stripe_price_basic:            "basic",
        settings.stripe_price_pro:              "pro",
        settings.stripe_price_business:         "business",
        settings.stripe_price_basic_yearly:     "basic",
        settings.stripe_price_pro_yearly:       "pro",
        settings.stripe_price_business_yearly:  "business",
    }
    return mapping.get(price_id, "")
