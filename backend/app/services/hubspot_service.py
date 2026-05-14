"""HubSpot CRM integration — creates/updates contacts via HubSpot API v3."""
from __future__ import annotations
from typing import TYPE_CHECKING
import httpx
from ..utils.config import settings

if TYPE_CHECKING:
    from ..utils.tenant_config import TenantConfig

_BASE = "https://api.hubapi.com"


def _headers(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


async def _find_by_phone(client: httpx.AsyncClient, api_key: str, phone: str) -> str | None:
    r = await client.post(
        f"{_BASE}/crm/v3/objects/contacts/search",
        headers=_headers(api_key),
        json={
            "filterGroups": [{"filters": [
                {"propertyName": "phone", "operator": "EQ", "value": phone}
            ]}],
            "properties": ["phone"],
            "limit": 1,
        },
    )
    if r.status_code != 200:
        return None
    results = r.json().get("results", [])
    return results[0]["id"] if results else None


async def push_contact(
    phone: str,
    first_name: str,
    last_name: str,
    email: str,
    intent: str,
    urgency: str,
    cfg: "TenantConfig | None" = None,
) -> str | None:
    """Creates or updates a HubSpot contact. Uses per-tenant API key if cfg is provided."""
    api_key = (cfg.hubspot_api_key if cfg else "") or settings.hubspot_api_key
    if not api_key:
        return None

    properties: dict = {
        "phone": phone,
        "firstname": first_name or "",
        "lastname": last_name or "",
        "lifecyclestage": "lead",
        "hs_lead_status": "IN_PROGRESS" if urgency == "high" else "NEW",
    }
    if email:
        properties["email"] = email

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            contact_id = await _find_by_phone(client, api_key, phone)
            if contact_id:
                r = await client.patch(
                    f"{_BASE}/crm/v3/objects/contacts/{contact_id}",
                    headers=_headers(api_key),
                    json={"properties": properties},
                )
            else:
                r = await client.post(
                    f"{_BASE}/crm/v3/objects/contacts",
                    headers=_headers(api_key),
                    json={"properties": properties},
                )
            if r.status_code in (200, 201):
                return r.json().get("id") or contact_id
    except Exception as exc:
        print(f"[hubspot] push_contact failed: {exc}")
    return None
