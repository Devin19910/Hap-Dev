"""
Per-tenant configuration — wraps a Client's stored credentials and falls back
to global .env settings so tenants that haven't configured their own credentials
still work out of the box.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any
from .config import settings


@dataclass
class TenantConfig:
    wa_phone_number_id: str = ""
    wa_access_token:    str = ""
    wa_verify_token:    str = ""
    wa_business_name:   str = ""
    ai_provider:        str = ""
    hubspot_api_key:    str = ""
    zoho_client_id:     str = ""
    zoho_client_secret: str = ""
    zoho_refresh_token: str = ""
    google_client_id:     str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    google_calendar_id:   str = "primary"
    google_timezone:      str = "Asia/Kolkata"
    vapi_api_key:         str = ""
    vapi_phone_number_id: str = ""


def build_tenant_config(client: Any) -> TenantConfig:
    """
    Build a TenantConfig from a Client ORM instance.
    Each field falls back to the matching global .env setting if blank on the client.
    """
    def _get(attr: str, fallback: str = "") -> str:
        return getattr(client, attr, "") or fallback

    return TenantConfig(
        wa_phone_number_id = _get("wa_phone_number_id", settings.whatsapp_phone_number_id),
        wa_access_token    = _get("wa_access_token",    settings.whatsapp_access_token),
        wa_verify_token    = _get("wa_verify_token",    settings.whatsapp_verify_token),
        wa_business_name   = _get("wa_business_name",   settings.whatsapp_business_name),
        ai_provider        = _get("ai_provider",        settings.default_ai_provider),
        hubspot_api_key    = _get("hubspot_api_key",    settings.hubspot_api_key),
        zoho_client_id     = _get("zoho_client_id",     settings.zoho_client_id),
        zoho_client_secret = _get("zoho_client_secret", settings.zoho_client_secret),
        zoho_refresh_token = _get("zoho_refresh_token", settings.zoho_refresh_token),
        google_client_id     = _get("google_client_id",     settings.google_client_id),
        google_client_secret = _get("google_client_secret", settings.google_client_secret),
        google_refresh_token = _get("google_refresh_token", settings.google_refresh_token),
        google_calendar_id   = _get("google_calendar_id",   settings.google_calendar_id),
        google_timezone      = _get("google_timezone",      settings.google_timezone),
        vapi_api_key         = _get("vapi_api_key",         settings.vapi_api_key),
        vapi_phone_number_id = _get("vapi_phone_number_id", settings.vapi_phone_number_id),
    )
