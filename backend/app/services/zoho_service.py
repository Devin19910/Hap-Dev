"""
Zoho CRM integration — creates/updates Leads via Zoho CRM API v2.

Requires ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in .env.
Access tokens are fetched on-demand using the refresh token (valid 1 hour each).
All functions are no-ops if credentials are not set.
"""
import httpx
from ..utils.config import settings

_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token"
_API_BASE  = "https://www.zohoapis.com/crm/v2"


async def _get_access_token() -> str | None:
    """Exchange the stored refresh token for a short-lived access token."""
    if not (settings.zoho_client_id and settings.zoho_client_secret and settings.zoho_refresh_token):
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(_TOKEN_URL, params={
                "refresh_token": settings.zoho_refresh_token,
                "client_id":     settings.zoho_client_id,
                "client_secret": settings.zoho_client_secret,
                "grant_type":    "refresh_token",
            })
            if r.status_code == 200:
                return r.json().get("access_token")
    except Exception as exc:
        print(f"[zoho] token refresh failed: {exc}")
    return None


async def _find_lead_by_phone(client: httpx.AsyncClient, token: str, phone: str) -> str | None:
    """Returns the Zoho Lead ID if a lead with this phone number exists."""
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
) -> str | None:
    """
    Creates or updates a Zoho CRM Lead.
    Returns the Zoho Lead ID on success, None on failure or if disabled.
    """
    if not settings.zoho_refresh_token:
        return None

    token = await _get_access_token()
    if not token:
        return None

    description_parts = []
    if intent:
        description_parts.append(f"Intent: {intent}")
    if urgency:
        description_parts.append(f"Urgency: {urgency}")
    if summary:
        description_parts.append(f"Summary: {summary}")

    lead_data: dict = {
        "Last_Name":    last_name or phone,
        "First_Name":   first_name or "",
        "Phone":        phone,
        "Lead_Source":  "WhatsApp",
        "Lead_Status":  "Not Contacted",
        "Description":  "\n".join(description_parts),
    }
    if email:
        lead_data["Email"] = email
    if urgency == "high":
        lead_data["Lead_Status"] = "Attempted to Contact"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {
                "Authorization": f"Zoho-oauthtoken {token}",
                "Content-Type": "application/json",
            }
            lead_id = await _find_lead_by_phone(client, token, phone)

            if lead_id:
                r = await client.put(
                    f"{_API_BASE}/Leads/{lead_id}",
                    headers=headers,
                    json={"data": [lead_data]},
                )
            else:
                r = await client.post(
                    f"{_API_BASE}/Leads",
                    headers=headers,
                    json={"data": [lead_data]},
                )

            if r.status_code in (200, 201):
                data = r.json().get("data", [{}])
                return data[0].get("details", {}).get("id") or lead_id
    except Exception as exc:
        print(f"[zoho] push_lead failed: {exc}")
    return None
