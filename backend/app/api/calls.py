from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.call_log import CallLog
from ..models.client import Client
from ..models.subscription import Subscription
from ..services import calling_service
from ..utils.auth import require_any_auth, get_tenant_scope, get_current_user
from ..utils.tenant_config import build_tenant_config

router = APIRouter(tags=["calls"])


class OutboundCallRequest(BaseModel):
    phone_number: str
    contact_id:   Optional[str] = None
    purpose:      str


# ── Call log endpoints ────────────────────────────────────────────────────────

@router.get("/calls")
def list_calls(
    client_id: Optional[str] = None,
    scope: Optional[str] = Depends(get_tenant_scope),
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    effective_id = scope or client_id
    q = db.query(CallLog)
    if effective_id:
        q = q.filter(CallLog.client_id == effective_id)
    return q.order_by(CallLog.created_at.desc()).all()


@router.get("/calls/{call_id}")
def get_call_log(
    call_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    log = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not log:
        raise HTTPException(404, "Call log not found")
    return log


@router.post("/calls/outbound", status_code=201)
async def trigger_outbound_call(
    body: OutboundCallRequest,
    scope: Optional[str] = Depends(get_tenant_scope),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Determine which client this call belongs to
    client_id = scope or getattr(current_user, "tenant_id", None)
    if not client_id:
        raise HTTPException(400, "client_id could not be determined from auth context")

    # Enforce business tier requirement
    sub = db.query(Subscription).filter(Subscription.client_id == client_id).first()
    if not sub or sub.tier != "business":
        raise HTTPException(
            403,
            "AI calling requires a Business tier subscription. "
            "Please upgrade your plan to access this feature.",
        )

    # Load client and resolve credentials
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")

    cfg = build_tenant_config(client)
    if not cfg.vapi_api_key or not cfg.vapi_phone_number_id:
        raise HTTPException(
            422,
            "Vapi credentials (vapi_api_key, vapi_phone_number_id) are not configured "
            "for this tenant. Add them in Settings.",
        )

    # Create a pending call log record
    log = CallLog(
        client_id    = client_id,
        contact_id   = body.contact_id or "",
        phone_number = body.phone_number,
        direction    = "outbound",
        status       = "queued",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Fire the Vapi outbound call
    try:
        vapi_response = await calling_service.make_outbound_call(
            to_number            = body.phone_number,
            client_name          = "",
            business_name        = client.name,
            purpose              = body.purpose,
            vapi_api_key         = cfg.vapi_api_key,
            vapi_phone_number_id = cfg.vapi_phone_number_id,
        )
    except Exception as exc:
        log.status = "failed"
        log.ended_reason = str(exc)
        db.commit()
        raise HTTPException(502, f"Vapi call initiation failed: {exc}")

    # Update the log with Vapi's call ID and initial status
    log.vapi_call_id = vapi_response.get("id", "")
    log.status       = vapi_response.get("status", "queued")
    log.updated_at   = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log


# ── Vapi webhook (public — no auth) ──────────────────────────────────────────

@router.post("/webhooks/vapi", status_code=200)
async def vapi_webhook(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Receives Vapi webhook events and updates the matching CallLog.

    Supported message types:
      - end-of-call-report  → marks call completed, saves transcript/recording/duration
      - status-update       → updates call status
    """
    message = payload.get("message", {})
    msg_type = message.get("type", "")
    call_data = message.get("call", {})
    vapi_call_id = call_data.get("id", "")

    if not vapi_call_id:
        # Nothing we can match — return 200 to prevent Vapi retries
        return {"received": True}

    log = db.query(CallLog).filter(CallLog.vapi_call_id == vapi_call_id).first()
    if not log:
        return {"received": True, "matched": False}

    if msg_type == "end-of-call-report":
        log.status       = "completed"
        log.transcript   = message.get("transcript", "") or ""
        log.recording_url = message.get("recordingUrl", "") or ""
        log.ended_reason  = message.get("endedReason", "") or ""

        # Compute duration from startedAt / endedAt if present
        started_at_str = call_data.get("startedAt")
        ended_at_str   = call_data.get("endedAt")
        if started_at_str and ended_at_str:
            try:
                fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
                started = datetime.strptime(started_at_str, fmt)
                ended   = datetime.strptime(ended_at_str,   fmt)
                log.duration_seconds = max(0, int((ended - started).total_seconds()))
            except ValueError:
                pass

    elif msg_type == "status-update":
        new_status = message.get("status", "")
        if new_status:
            log.status = new_status

    log.updated_at = datetime.utcnow()
    db.commit()
    return {"received": True, "matched": True, "call_log_id": log.id}
