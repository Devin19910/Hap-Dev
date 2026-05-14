"""
Tenant management API — self-service registration and per-tenant configuration.

Public:   POST /tenants/register
Auth:     GET  /tenants             (platform admin)
          GET  /tenants/{id}        (platform admin or own tenant)
          PUT  /tenants/{id}/config (own tenant or platform admin)
          POST /tenants/{id}/suspend   (platform admin)
          POST /tenants/{id}/activate  (platform admin)
"""
import re
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..models.base import get_db
from ..models.client import Client
from ..models.admin_user import AdminUser
from ..models.subscription import Subscription
from ..api.auth import hash_password, create_token
from ..utils.auth import require_any_auth, require_platform_admin, get_tenant_scope
from ..utils.config import settings

router = APIRouter(prefix="/tenants", tags=["tenants"])

BUSINESS_TYPES = ["general", "salon", "clinic", "gym", "immigration", "trucking", "restaurant", "other"]
TIER_LIMITS = {"free": 50, "basic": 500, "pro": 5000}


# ── Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    business_name: str
    email:         EmailStr
    password:      str
    business_type: str = "general"


class TenantConfigUpdate(BaseModel):
    # WhatsApp
    wa_phone_number_id: Optional[str] = None
    wa_access_token:    Optional[str] = None
    wa_verify_token:    Optional[str] = None
    wa_business_name:   Optional[str] = None
    # AI
    ai_provider:        Optional[str] = None
    # HubSpot
    hubspot_api_key:    Optional[str] = None
    # Zoho
    zoho_client_id:     Optional[str] = None
    zoho_client_secret: Optional[str] = None
    zoho_refresh_token: Optional[str] = None
    # Google Calendar
    google_client_id:     Optional[str] = None
    google_client_secret: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_calendar_id:   Optional[str] = None
    google_timezone:      Optional[str] = None
    # Business info
    name:          Optional[str] = None
    business_type: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────

def _make_slug(name: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:40]
    slug = base
    n = 2
    while db.query(Client).filter(Client.slug == slug).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _tenant_out(client: Client, include_secrets: bool = False) -> dict:
    d = {
        "id":            client.id,
        "name":          client.name,
        "email":         client.email,
        "slug":          client.slug,
        "status":        client.status,
        "business_type": client.business_type,
        "is_active":     client.is_active,
        "created_at":    client.created_at,
        "api_key":       client.api_key,
        # Config indicators (not secrets unless include_secrets=True)
        "has_whatsapp":  bool(client.wa_phone_number_id),
        "has_hubspot":   bool(client.hubspot_api_key),
        "has_zoho":      bool(client.zoho_refresh_token),
        "has_gcal":      bool(client.google_refresh_token),
        "ai_provider":   client.ai_provider or settings.default_ai_provider,
    }
    if include_secrets:
        d.update({
            "wa_phone_number_id": client.wa_phone_number_id,
            "wa_verify_token":    client.wa_verify_token,
            "wa_business_name":   client.wa_business_name,
            "hubspot_api_key":    client.hubspot_api_key,
            "zoho_client_id":     client.zoho_client_id,
            "zoho_refresh_token": client.zoho_refresh_token,
            "google_client_id":   client.google_client_id,
            "google_refresh_token": client.google_refresh_token,
            "google_calendar_id": client.google_calendar_id,
            "google_timezone":    client.google_timezone,
        })
    return d


# ── Public registration ────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register_tenant(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Self-service tenant registration.
    Creates a Client (tenant), a free Subscription, and the first tenant_owner AdminUser.
    Returns a JWT so the user is logged in immediately after registration.
    """
    if db.query(AdminUser).filter(AdminUser.email == body.email).first():
        raise HTTPException(409, "Email already registered")
    if db.query(Client).filter(Client.email == body.email).first():
        raise HTTPException(409, "Business email already registered")
    if len(body.password) < 8:
        raise HTTPException(422, "Password must be at least 8 characters")
    if body.business_type not in BUSINESS_TYPES:
        body.business_type = "general"

    slug = _make_slug(body.business_name, db)

    client = Client(
        name=body.business_name,
        email=body.email,
        slug=slug,
        status="active",
        business_type=body.business_type,
        wa_business_name=body.business_name,
    )
    db.add(client)
    db.flush()  # get client.id before creating subscription + user

    sub = Subscription(
        client_id=client.id,
        tier="free",
        monthly_limit=TIER_LIMITS["free"],
        requests_used=0,
        is_active=True,
    )
    db.add(sub)

    admin = AdminUser(
        email=body.email,
        hashed_password=hash_password(body.password),
        first_name=body.business_name,
        role="tenant_owner",
        tenant_id=client.id,
    )
    db.add(admin)
    client.owner_user_id = admin.id
    db.commit()
    db.refresh(client)
    db.refresh(admin)

    token = create_token({"sub": admin.id, "role": admin.role, "email": admin.email})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         admin.role,
        "first_name":   admin.first_name,
        "tenant_id":    client.id,
        "tenant":       _tenant_out(client),
    }


# ── Platform admin: list / manage tenants ─────────────────────────────────

@router.get("")
def list_tenants(
    _: AdminUser = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    clients = db.query(Client).order_by(Client.created_at.desc()).all()
    return [_tenant_out(c) for c in clients]


@router.get("/{tenant_id}")
def get_tenant(
    tenant_id: str,
    scope: Optional[str] = Depends(get_tenant_scope),
    _=Depends(require_any_auth),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == tenant_id).first()
    if not client:
        raise HTTPException(404, "Tenant not found")
    # Tenant admins can only see their own tenant
    if scope and scope != tenant_id:
        raise HTTPException(403, "Access denied")
    include_secrets = (scope == tenant_id) or (scope is None)
    return _tenant_out(client, include_secrets=include_secrets)


@router.put("/{tenant_id}/config")
def update_tenant_config(
    tenant_id: str,
    body: TenantConfigUpdate,
    scope: Optional[str] = Depends(get_tenant_scope),
    _=Depends(require_any_auth),
    db: Session = Depends(get_db),
):
    """Update per-tenant configuration. Tenant owners can only update their own tenant."""
    if scope and scope != tenant_id:
        raise HTTPException(403, "Access denied")

    client = db.query(Client).filter(Client.id == tenant_id).first()
    if not client:
        raise HTTPException(404, "Tenant not found")

    for field, value in body.model_dump(exclude_none=True).items():
        if hasattr(client, field):
            setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return _tenant_out(client, include_secrets=True)


@router.post("/{tenant_id}/suspend")
def suspend_tenant(
    tenant_id: str,
    _: AdminUser = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == tenant_id).first()
    if not client:
        raise HTTPException(404, "Tenant not found")
    client.status    = "suspended"
    client.is_active = False
    db.commit()
    return {"status": "suspended"}


@router.post("/{tenant_id}/activate")
def activate_tenant(
    tenant_id: str,
    _: AdminUser = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == tenant_id).first()
    if not client:
        raise HTTPException(404, "Tenant not found")
    client.status    = "active"
    client.is_active = True
    db.commit()
    return {"status": "active"}


@router.get("/{tenant_id}/usage")
def tenant_usage(
    tenant_id: str,
    scope: Optional[str] = Depends(get_tenant_scope),
    _=Depends(require_any_auth),
    db: Session = Depends(get_db),
):
    if scope and scope != tenant_id:
        raise HTTPException(403, "Access denied")
    sub = db.query(Subscription).filter(Subscription.client_id == tenant_id).first()
    if not sub:
        raise HTTPException(404, "No subscription found")
    return {
        "tier":           sub.tier,
        "monthly_limit":  sub.monthly_limit,
        "requests_used":  sub.requests_used,
        "remaining":      max(0, sub.monthly_limit - sub.requests_used),
        "is_active":      sub.is_active,
        "usage_pct":      round(sub.requests_used / sub.monthly_limit * 100, 1) if sub.monthly_limit else 0,
    }
