from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from ..utils.config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_secret(x_webhook_secret: str = Header(...)):
    if x_webhook_secret != settings.webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")


class N8NTriggerPayload(BaseModel):
    event: str
    client_id: str = ""
    data: dict = {}


class WhatsAppMessage(BaseModel):
    phone_number: str
    message: str
    profile_name: str = ""


@router.post("/n8n/trigger")
async def n8n_trigger(payload: N8NTriggerPayload, request: Request):
    """Receives a trigger from n8n and dispatches to the appropriate handler."""
    return {
        "received": True,
        "event": payload.event,
        "client_id": payload.client_id,
        "data": payload.data,
    }


@router.post("/whatsapp/message")
async def whatsapp_message(payload: WhatsAppMessage):
    """Receives an inbound WhatsApp message. Wire to AI triage in next iteration."""
    return {
        "received": True,
        "phone": payload.phone_number,
        "message_preview": payload.message[:80],
    }
