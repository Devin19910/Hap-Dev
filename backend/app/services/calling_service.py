"""
Vapi.ai AI calling service.
Handles outbound call initiation and call status retrieval via the Vapi REST API.
"""
import httpx

VAPI_BASE_URL = "https://api.vapi.ai"


async def make_outbound_call(
    to_number: str,
    client_name: str,
    business_name: str,
    purpose: str,
    vapi_api_key: str,
    vapi_phone_number_id: str,
) -> dict:
    """
    Initiate an outbound call via Vapi.ai.
    Uses an inline assistant config with Claude claude-haiku-4-5-20251001 and 11labs voice.
    Returns the Vapi call response dict.
    """
    payload = {
        "phoneNumberId": vapi_phone_number_id,
        "customer": {
            "number": to_number,
            "name": client_name,
        },
        "assistant": {
            "model": {
                "provider": "anthropic",
                "model": "claude-haiku-4-5-20251001",
                "systemPrompt": (
                    f"You are a friendly AI assistant calling on behalf of {business_name}. "
                    f"Purpose: {purpose}. Be concise and professional."
                ),
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "sarah",
            },
            "firstMessage": (
                f"Hello, this is an AI assistant calling from {business_name}. "
                f"{purpose}. Is this a good time to talk?"
            ),
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/call/phone",
            json=payload,
            headers={
                "Authorization": f"Bearer {vapi_api_key}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        return response.json()


async def get_call(call_id: str, vapi_api_key: str) -> dict:
    """Retrieve a single call record from Vapi by its call ID."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/call/{call_id}",
            headers={"Authorization": f"Bearer {vapi_api_key}"},
        )
        response.raise_for_status()
        return response.json()


async def list_calls(vapi_api_key: str, limit: int = 50) -> dict:
    """List recent calls from Vapi."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/call",
            params={"limit": limit},
            headers={"Authorization": f"Bearer {vapi_api_key}"},
        )
        response.raise_for_status()
        return response.json()
