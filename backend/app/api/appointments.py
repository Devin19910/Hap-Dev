from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.appointment import Appointment
from ..services import appointment_service
from ..utils.auth import require_any_auth

router = APIRouter(prefix="/appointments", tags=["appointments"])


class AppointmentCreate(BaseModel):
    client_id:         str
    phone_number:      str = ""
    customer_name:     str = ""
    service:           str = ""
    notes:             str = ""
    requested_at_text: str = ""
    contact_id:        str = ""


class AppointmentUpdate(BaseModel):
    service:           Optional[str]      = None
    notes:             Optional[str]      = None
    requested_at_text: Optional[str]      = None
    status:            Optional[str]      = None
    scheduled_at:      Optional[datetime] = None
    duration_minutes:  Optional[int]      = None


class ConfirmPayload(BaseModel):
    scheduled_at:     datetime
    duration_minutes: int  = 60
    service:          str  = ""
    notify_customer:  bool = True


@router.get("")
def list_appointments(
    client_id: Optional[str] = None,
    status:    Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    q = db.query(Appointment)
    if client_id:
        q = q.filter(Appointment.client_id == client_id)
    if status:
        q = q.filter(Appointment.status == status)
    return q.order_by(Appointment.updated_at.desc()).all()


@router.get("/{appointment_id}")
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    a = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(404, "Appointment not found")
    return a


@router.post("", status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    return await appointment_service.create_pending(
        db=db,
        client_id=body.client_id,
        phone=body.phone_number,
        customer_name=body.customer_name,
        notes=body.notes,
        requested_at_text=body.requested_at_text,
        service=body.service,
        contact_id=body.contact_id,
    )


@router.patch("/{appointment_id}")
def update_appointment(
    appointment_id: str,
    body: AppointmentUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    a = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(404, "Appointment not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(a, field, value)
    a.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return a


@router.post("/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: str,
    body: ConfirmPayload,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    """Confirms a pending appointment, syncs to Google Calendar, optionally notifies customer."""
    try:
        return await appointment_service.confirm(
            db=db,
            appointment_id=appointment_id,
            scheduled_at=body.scheduled_at,
            duration_minutes=body.duration_minutes,
            service=body.service,
            notify_customer=body.notify_customer,
        )
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    """Cancels the appointment and removes it from Google Calendar."""
    try:
        return await appointment_service.cancel(db=db, appointment_id=appointment_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/{appointment_id}/send-reminder")
async def send_reminder(
    appointment_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    """Sends a WhatsApp reminder. Intended to be called by n8n 24h before the appointment."""
    sent = await appointment_service.send_reminder(db=db, appointment_id=appointment_id)
    if not sent:
        raise HTTPException(400, "Reminder not sent — appointment not confirmed or no phone number")
    return {"status": "sent"}
