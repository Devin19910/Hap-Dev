import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from .base import Base


class Client(Base):
    __tablename__ = "clients"

    # Core identity
    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False)
    api_key    = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Tenant identity
    slug          = Column(String, unique=True, nullable=True)   # URL-friendly, e.g. "sunshine-salon"
    status        = Column(String, default="active")             # active | suspended | pending
    business_type = Column(String, default="general")            # salon | clinic | gym | general | etc.
    owner_user_id = Column(String, default="")                   # AdminUser.id of the tenant owner

    # Per-tenant WhatsApp Cloud API credentials
    wa_phone_number_id = Column(String, default="")
    wa_access_token    = Column(String, default="")
    wa_verify_token    = Column(String, default="")
    wa_business_name   = Column(String, default="")

    # Per-tenant AI provider preference
    ai_provider = Column(String, default="")   # overrides global DEFAULT_AI_PROVIDER

    # Per-tenant HubSpot
    hubspot_api_key = Column(String, default="")

    # Per-tenant Zoho CRM
    zoho_client_id     = Column(String, default="")
    zoho_client_secret = Column(String, default="")
    zoho_refresh_token = Column(String, default="")

    # Per-tenant Google Calendar
    google_client_id     = Column(String, default="")
    google_client_secret = Column(String, default="")
    google_refresh_token = Column(String, default="")
    google_calendar_id   = Column(String, default="primary")
    google_timezone      = Column(String, default="Asia/Kolkata")

    # Per-tenant Vapi (AI Calling Agent)
    vapi_api_key         = Column(String, default="")
    vapi_phone_number_id = Column(String, default="")
