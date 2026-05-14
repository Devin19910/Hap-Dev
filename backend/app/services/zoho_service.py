"""Zoho CRM integration — creates/updates Leads via Zoho CRM API v2."""
from __future__ import annotations
from typing import TYPE_CHECKING
import httpx
from ..utils.config import settings

if TYPE_CHECKING:
    from ..utils.tenant_config import TenantConfig

_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token"
_API_BASE  = "https://www.zohoapis.com/crm/v2"


async def _get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str | None:
    if not (client_id and client_secret and refresh_token):
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(_TOKEN_URL, params={
                "refresh_token": refresh_token,
                "client_id":     client_id,
                "client_secret": client_secret,
                "grant_type":    "refresh_token",
            })
            if r.status_code == 200:
                return r.json().get("access_token")
    except Exception as exc:
        print(f"[zoho] token refresh failed: {exc}")
    return None


async def _find_lead_by_phone(client: httpx.AsyncClient, token: str, phone: str) -> str | None:
    r = await client.get(
        f"{_API_BASE}/Leads/search",
        headers={"Authorization": f"Zoho-oauthtoken {token}"},
        params={"criteria": f"(Phone:equals:{phone})"},
    )
    if r.status_code != 200:
        return None
    data = r.json().get("data", [])
    return data[0]["id"] if data else None


async def push_lead(
    phone: str,
    first_name: str,
    last_name: str,
    email: str,
    intent: str,
    urgency: str,
    summary: str,
    cfg: "TenantConfig | None" = None,
) -> str | None:
    """Creates or updates a Zoho CRM Lead. Uses per-tenant credentials if cfg is provided."""
    r_token  = (cfg.zoho_refresh_token  if cfg else "") or settings.zoho_refresh_token
    c_id     = (cfg.zoho_client_id      if cfg else "") or settings.zoho_client_id
    c_secret = (cfg.zoho_client_secret  if cfg else "") or settings.zoho_client_secret
    if not r_token:
        return None

    token = await _get_access_token(c_id, c_secret, r_token)
    if not token:
        return None

    description_parts = [p for p in [
        f"Intent: {intent}" if intent else "",
        f"Urgency: {urgency}" if urgency else "",
        f"Summary: {summary}" if summary else "",
    ] if p]

    lead_data: dict = {
        "Last_Name":   last_name or phone,
        "First_Name":  first_name or "",
        "Phone":       phone,
        "Lead_Source": "WhatsApp",
        "Lead_Status": "Attempted to Contact" if urgency == "high" else "Not Contacted",
        "Description": "\n".join(description_parts),
    }
    if email:
        lead_data["Email"] = email

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {
                "Authorization": f"Zoho-oauthtoken {token}",
                "Content-Type": "application/json",
            }
            lead_id = await _find_lead_by_phone(client, token, phone)
            if lead_id:
                r = await client.put(f"{_API_BASE}/Leads/{lead_id}", headers=headers, json={"data": [lead_data]})
            else:
                r = await client.post(f"{_API_BASE}/Leads", headers=headers, json={"data": [lead_data]})
            if r.status_code in (200, 201):
                data = r.json().get("data", [{}])
                return data[0].get("details", {}).get("id") or lead_id
    except Exception as exc:
        print(f"[zoho] push_lead failed: {exc}")
    return None
