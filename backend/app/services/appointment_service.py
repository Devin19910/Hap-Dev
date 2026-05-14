"""
Appointment booking service — manages the full lifecycle of appointments.

create_pending()  — called automatically when WhatsApp booking intent detected
confirm()         — called by operator via dashboard; syncs to Google Calendar
cancel()          — cancels appointment and removes Google Calendar event
send_reminder()   — sends WhatsApp reminder to customer (called by n8n)
"""
import asyncio
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.appointment import Appointment
from ..utils.config import settings
from . import google_calendar_service
from .whatsapp_service import send_message


async def create_pending(
    db: Session,
    client_id: str,
    phone: str,
    customer_name: str,
    notes: str = "",
    requested_at_text: str = "",
    service: str = "",
    contact_id: str = "",
) -> Appointment:
    """Creates a pending appointment from a WhatsApp booking request."""
    appt = Appointment(
        client_id         = client_id,
        contact_id        = contact_id,
        phone_number      = phone,
        customer_name     = customer_name,
        service           = service,
        notes             = notes,
        requested_at_text = requested_at_text,
        status            = "pending",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


async def confirm(
    db: Session,
    appointment_id: str,
    scheduled_at: datetime,
    duration_minutes: int = 60,
    service: str = "",
    notify_customer: bool = True,
) -> Appointment:
    """
    Confirms a pending appointment.
    Creates a Google Calendar event and optionally sends a WhatsApp confirmation.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise ValueError(f"Appointment {appointment_id} not found")

    if service:
        appt.service = service
    appt.scheduled_at     = scheduled_at
    appt.duration_minutes = duration_minutes
    appt.status           = "confirmed"
    appt.updated_at       = datetime.utcnow()
    db.commit()
    db.refresh(appt)

    # Google Calendar sync in background
    asyncio.create_task(_sync_calendar(db, appt))

    # WhatsApp confirmation
    if notify_customer and appt.phone_number:
        asyncio.create_task(_send_confirmation(appt))

    # Trigger n8n reminder workflow
    if settings.n8n_appointment_webhook:
        asyncio.create_task(_notify_n8n(appt))

    return appt


async def cancel(db: Session, appointment_id: str) -> Appointment:
    """Cancels an appointment and removes it from Google Calendar."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise ValueError(f"Appointment {appointment_id} not found")

    appt.status     = "cancelled"
    appt.updated_at = datetime.utcnow()
    db.commit()

    if appt.google_event_id:
        asyncio.create_task(google_calendar_service.delete_event(appt.google_event_id))

    db.refresh(appt)
    return appt


async def send_reminder(db: Session, appointment_id: str) -> bool:
    """Sends a WhatsApp reminder. Called by n8n 24h before the appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt or appt.status != "confirmed" or not appt.phone_number:
        return False

    service_str = appt.service or "appointment"
    time_str = appt.scheduled_at.strftime("%I:%M %p") if appt.scheduled_at else "your scheduled time"
    date_str = appt.scheduled_at.strftime("%A, %B %-d") if appt.scheduled_at else "tomorrow"

    msg = (
        f"Hi {appt.customer_name or 'there'}! Just a reminder: "
        f"your {service_str} is tomorrow, {date_str} at {time_str}. "
        f"Reply if you need to reschedule. See you then!"
    )
    try:
        await send_message(appt.phone_number, msg)
        appt.reminder_sent = True
        db.commit()
        return True
    except Exception as exc:
        print(f"[appointments] reminder failed: {exc}")
        return False


async def _notify_n8n(appt: Appointment) -> None:
    payload = {
        "event":           "appointment_confirmed",
        "appointment_id":  appt.id,
        "client_id":       appt.client_id,
        "customer_name":   appt.customer_name,
        "phone":           appt.phone_number,
        "service":         appt.service,
        "scheduled_at":    appt.scheduled_at.isoformat() if appt.scheduled_at else "",
        "duration_minutes": appt.duration_minutes,
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(settings.n8n_appointment_webhook, json=payload)
    except Exception as exc:
        print(f"[appointments] n8n webhook failed: {exc}")


async def _sync_calendar(db: Session, appt: Appointment) -> None:
    if not appt.scheduled_at:
        return

    summary = f"{appt.service or 'Appointment'}: {appt.customer_name or appt.phone_number}"
    description = "\n".join(filter(None, [
        f"Phone: {appt.phone_number}",
        f"Requested: {appt.requested_at_text}" if appt.requested_at_text else "",
        f"Notes: {appt.notes}" if appt.notes else "",
    ]))

    if appt.google_event_id:
        await google_calendar_service.update_event(
            event_id=appt.google_event_id,
            summary=summary,
            description=description,
            start_dt=appt.scheduled_at,
            duration_minutes=appt.duration_minutes,
        )
    else:
        event_id = await google_calendar_service.create_event(
            summary=summary,
            description=description,
            start_dt=appt.scheduled_at,
            duration_minutes=appt.duration_minutes,
        )
        if event_id:
            try:
                appt.google_event_id = event_id
                db.commit()
            except Exception:
                pass


async def _send_confirmation(appt: Appointment) -> None:
    service_str = appt.service or "appointment"
    time_str    = appt.scheduled_at.strftime("%I:%M %p") if appt.scheduled_at else ""
    date_str    = appt.scheduled_at.strftime("%A, %B %-d") if appt.scheduled_at else ""

    msg = (
        f"Hi {appt.customer_name or 'there'}! Your {service_str} is confirmed "
        f"for {date_str} at {time_str}. "
        f"We look forward to seeing you! Reply to reschedule if needed."
    )
    try:
        await send_message(appt.phone_number, msg)
    except Exception as exc:
        print(f"[appointments] confirmation WA failed: {exc}")
