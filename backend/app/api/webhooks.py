import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.client import Client
from ..models.whatsapp_conversation import WhatsAppConversation
from ..models.subscription import Subscription
from ..services import ai_router as ai_service
from ..services.whatsapp_service import send_message, parse_inbound
from ..services import crm_service
from ..services import appointment_service
from ..utils.config import settings
from ..utils.tenant_config import build_tenant_config, TenantConfig

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# ── n8n trigger ────────────────────────────────────────────────────────────

class N8NTriggerPayload(BaseModel):
    event: str
    client_id: str = ""
    data: dict = {}


@router.post("/n8n/trigger")
async def n8n_trigger(payload: N8NTriggerPayload):
    return {"received": True, "event": payload.event, "client_id": payload.client_id}


# ── WhatsApp webhook verification (GET) ────────────────────────────────────

@router.get("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_verify(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    """Meta calls this once to verify the webhook URL."""
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


# ── WhatsApp inbound message (POST) ───────────────────────────────────────

@router.post("/whatsapp")
async def whatsapp_message(request: Request, db: Session = Depends(get_db)):
    """
    Receives inbound WhatsApp messages from Meta.
    Flow: parse → AI triage + reply generation → send reply → log conversation.
    Returns 200 immediately; actual send happens in background.
    """
    payload = await request.json()

    parsed = parse_inbound(payload)
    if not parsed:
        # Status updates, delivery receipts — acknowledge and ignore
        return {"status": "ok"}

    phone, message, display_name = parsed
    client_id = settings.whatsapp_client_id

    # Check subscription before calling AI
    if client_id:
        sub = db.query(Subscription).filter(
            Subscription.client_id == client_id,
            Subscription.is_active == True,
        ).first()
        if sub and sub.requests_used >= sub.monthly_limit:
            asyncio.create_task(send_message(
                phone, "Sorry, we're temporarily unavailable. Please call us directly."
            ))
            return {"status": "limit_reached"}

    prompt = _build_prompt(message, settings.whatsapp_business_name)

    try:
        result = await ai_service.run(prompt, provider=settings.default_ai_provider)
        triage = _parse_triage(result["text"])
    except Exception as e:
        asyncio.create_task(send_message(
            phone, "Thanks for your message! We'll get back to you shortly."
        ))
        return {"status": "ai_error", "detail": str(e)}

    reply_text = triage.get("reply", "Thanks for your message! We'll get back to you shortly.")

    asyncio.create_task(_send_and_log(
        db, phone, display_name, message, reply_text, triage, client_id
    ))
    asyncio.create_task(crm_service.upsert_contact(
        db=db,
        client_id=client_id or "",
        phone=phone,
        display_name=display_name,
        intent=triage.get("intent", ""),
        urgency=triage.get("urgency", ""),
        summary=triage.get("summary", ""),
        source="whatsapp",
    ))

    if triage.get("intent") == "booking":
        asyncio.create_task(appointment_service.create_pending(
            db=db,
            client_id=client_id or "",
            phone=phone,
            customer_name=display_name,
            notes=message,
            requested_at_text=triage.get("requested_time", ""),
            service=triage.get("service_type", ""),
        ))

    return {"status": "ok"}


# ── Helpers ────────────────────────────────────────────────────────────────

def _build_prompt(message: str, business_name: str) -> str:
    return f"""You are a helpful assistant for {business_name} responding via WhatsApp.

A customer sent this message: "{message}"

Respond with a JSON object only (no markdown, no explanation):
{{
  "intent": "booking|complaint|general_inquiry|pricing|emergency|spam",
  "urgency": "high|medium|low",
  "language": "en|hi|pa|other",
  "suggested_action": "book_appointment|escalate_to_human|send_pricing|auto_reply",
  "summary": "one sentence summary",
  "requested_time": "extracted date/time if mentioned, else empty string",
  "service_type": "type of service requested if mentioned (e.g. haircut, consultation), else empty string",
  "reply": "your friendly 1-2 sentence WhatsApp reply to the customer"
}}

Reply rules: match the customer language, be warm, keep it under 160 chars.
For emergencies say someone will call them. For bookings ask for date/time preference if not already given."""


def _parse_triage(text: str) -> dict:
    import re
    try:
        match = re.search(r"\{[\s\S]*?\}", text)
        return json.loads(match.group() if match else text)
    except Exception:
        return {
            "intent": "general_inquiry",
            "urgency": "low",
            "reply": "Thanks for your message! We'll get back to you shortly.",
        }


async def _send_and_log(
    db: Session,
    phone: str,
    display_name: str,
    message: str,
    reply_text: str,
    triage: dict,
    client_id: str,
    cfg: TenantConfig | None = None,
):
    try:
        wa_kwargs = {}
        if cfg:
            wa_kwargs = {"phone_number_id": cfg.wa_phone_number_id, "access_token": cfg.wa_access_token}
        await send_message(phone, reply_text, **wa_kwargs)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"WhatsApp send failed to {phone}: {e}")

    try:
        conv = db.query(WhatsAppConversation).filter(
            WhatsAppConversation.phone_number == phone
        ).first()

        if conv:
            conv.last_message = message
            conv.last_reply = reply_text
            conv.last_intent = triage.get("intent", "")
            conv.display_name = display_name or conv.display_name
            conv.message_count = str(int(conv.message_count or "0") + 1)
            conv.updated_at = datetime.utcnow()
        else:
            conv = WhatsAppConversation(
                phone_number=phone,
                client_id=client_id or "",
                display_name=display_name,
                last_message=message,
                last_reply=reply_text,
                last_intent=triage.get("intent", ""),
                message_count="1",
            )
            db.add(conv)

        db.commit()
    except Exception:
        pass


# ── Per-tenant WhatsApp webhooks ────────────────────────────────────────────
# Each tenant registers: https://yourdomain.com/webhooks/whatsapp/{tenant_id}
# as their Meta webhook URL. This allows different businesses to have their
# own WhatsApp numbers and credentials while sharing the same platform.

@router.get("/whatsapp/{tenant_id}", response_class=PlainTextResponse)
async def whatsapp_verify_tenant(
    tenant_id: str,
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == tenant_id, Client.is_active == True).first()
    if not client:
        raise HTTPException(status_code=404, detail="Tenant not found")
    verify_token = client.wa_verify_token or settings.whatsapp_verify_token
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/{tenant_id}")
async def whatsapp_message_tenant(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Per-tenant inbound WhatsApp handler. Uses the tenant's own credentials and AI config."""
    client = db.query(Client).filter(Client.id == tenant_id, Client.is_active == True).first()
    if not client:
        return {"status": "tenant_not_found"}

    cfg = build_tenant_config(client)
    payload = await request.json()
    parsed = parse_inbound(payload)
    if not parsed:
        return {"status": "ok"}

    phone, message, display_name = parsed

    sub = db.query(Subscription).filter(
        Subscription.client_id == tenant_id,
        Subscription.is_active == True,
    ).first()
    if sub and sub.requests_used >= sub.monthly_limit:
        asyncio.create_task(send_message(
            phone,
            "Sorry, we're temporarily unavailable. Please call us directly.",
            phone_number_id=cfg.wa_phone_number_id,
            access_token=cfg.wa_access_token,
        ))
        return {"status": "limit_reached"}

    prompt = _build_prompt(message, cfg.wa_business_name)
    try:
        result = await ai_service.run(prompt, provider=cfg.ai_provider)
        triage = _parse_triage(result["text"])
    except Exception as e:
        asyncio.create_task(send_message(
            phone,
            "Thanks for your message! We'll get back to you shortly.",
            phone_number_id=cfg.wa_phone_number_id,
            access_token=cfg.wa_access_token,
        ))
        return {"status": "ai_error", "detail": str(e)}

    reply_text = triage.get("reply", "Thanks for your message! We'll get back to you shortly.")

    asyncio.create_task(_send_and_log(
        db, phone, display_name, message, reply_text, triage, tenant_id, cfg
    ))
    asyncio.create_task(crm_service.upsert_contact(
        db=db,
        client_id=tenant_id,
        phone=phone,
        display_name=display_name,
        intent=triage.get("intent", ""),
        urgency=triage.get("urgency", ""),
        summary=triage.get("summary", ""),
        source="whatsapp",
        cfg=cfg,
    ))
    if triage.get("intent") == "booking":
        asyncio.create_task(appointment_service.create_pending(
            db=db,
            client_id=tenant_id,
            phone=phone,
            customer_name=display_name,
            notes=message,
            requested_at_text=triage.get("requested_time", ""),
            service=triage.get("service_type", ""),
        ))

    return {"status": "ok"}
