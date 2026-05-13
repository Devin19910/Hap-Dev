"""
HubSpot CRM integration — creates/updates contacts via HubSpot API v3.

Requires HUBSPOT_API_KEY in .env (a Private App token from developers.hubspot.com).
All functions are no-ops if the key is not set.
"""
import httpx
from ..utils.config import settings

_BASE = "https://api.hubapi.com"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.hubspot_api_key}",
        "Content-Type": "application/json",
    }


async def _find_by_phone(client: httpx.AsyncClient, phone: str) -> str | None:
    """Returns the HubSpot internal contact ID if a contact with this phone exists."""
    r = await client.post(
        f"{_BASE}/crm/v3/objects/contacts/search",
        headers=_headers(),
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
) -> str | None:
    """
    Creates or updates a HubSpot contact.
    Returns the HubSpot contact ID on success, None on failure or if disabled.
    """
    if not settings.hubspot_api_key:
        return None

    properties: dict = {
        "phone": phone,
        "firstname": first_name or "",
        "lastname": last_name or "",
        "lifecyclestage": "lead",
        "hs_lead_status": "NEW",
    }
    if email:
        properties["email"] = email
    if urgency == "high":
        properties["hs_lead_status"] = "IN_PROGRESS"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            contact_id = await _find_by_phone(client, phone)

            if contact_id:
                r = await client.patch(
                    f"{_BASE}/crm/v3/objects/contacts/{contact_id}",
                    headers=_headers(),
                    json={"properties": properties},
                )
            else:
                r = await client.post(
                    f"{_BASE}/crm/v3/objects/contacts",
                    headers=_headers(),
                    json={"properties": properties},
                )

            if r.status_code in (200, 201):
                return r.json().get("id") or contact_id
    except Exception as exc:
        print(f"[hubspot] push_contact failed: {exc}")
    return None
