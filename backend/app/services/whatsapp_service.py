import httpx
from ..utils.config import settings

GRAPH_URL = "https://graph.facebook.com/v19.0"


async def send_message(
    to: str,
    text: str,
    *,
    phone_number_id: str = "",
    access_token: str = "",
) -> dict:
    """
    Send a text message via WhatsApp Cloud API.
    Per-tenant credentials override global settings when provided.
    """
    pid = phone_number_id or settings.whatsapp_phone_number_id
    tok = access_token    or settings.whatsapp_access_token
    url = f"{GRAPH_URL}/{pid}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": text},
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {tok}"},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()


def parse_inbound(payload: dict) -> tuple[str, str, str] | None:
    """
    Extract (phone_number, message_text, display_name) from a WhatsApp webhook payload.
    Returns None for non-message events (status updates, delivery receipts, etc.).
    """
    try:
        entry  = payload["entry"][0]
        change = entry["changes"][0]["value"]
        msg    = change["messages"][0]
        if msg.get("type") != "text":
            return None
        phone = msg["from"]
        text  = msg["text"]["body"]
        name  = change.get("contacts", [{}])[0].get("profile", {}).get("name", "")
        return phone, text, name
    except (KeyError, IndexError):
        return None
