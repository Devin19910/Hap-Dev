"""
CRM orchestrator — upserts contacts in the internal DB and syncs to external CRMs.

Call upsert_contact() whenever a new lead arrives (WhatsApp message, manual entry, etc.).
External CRM pushes (HubSpot, Zoho) run as fire-and-forget background tasks.
"""
import asyncio
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.contact import Contact
from ..utils.config import settings
from . import hubspot_service, zoho_service


async def upsert_contact(
    db: Session,
    client_id: str,
    phone: str = "",
    email: str = "",
    display_name: str = "",
    intent: str = "",
    urgency: str = "",
    summary: str = "",
    source: str = "whatsapp",
) -> Contact:
    """
    Creates or updates a contact in the internal DB, then kicks off CRM syncs.
    Splits display_name into first/last on first space.
    """
    parts = (display_name or "").strip().split(" ", 1)
    first_name = parts[0]
    last_name  = parts[1] if len(parts) > 1 else ""

    # Look up by phone (primary key for WhatsApp contacts)
    contact = db.query(Contact).filter(
        Contact.client_id == client_id,
        Contact.phone_number == phone,
    ).first() if phone else None

    is_new = contact is None

    if contact:
        if display_name and not contact.first_name:
            contact.first_name = first_name
            contact.last_name  = last_name
        if email and not contact.email:
            contact.email = email
        if intent:
            contact.last_intent  = intent
            contact.last_urgency = urgency
            contact.last_summary = summary
        contact.updated_at = datetime.utcnow()
    else:
        contact = Contact(
            client_id    = client_id,
            phone_number = phone,
            email        = email,
            first_name   = first_name,
            last_name    = last_name,
            source       = source,
            last_intent  = intent,
            last_urgency = urgency,
            last_summary = summary,
        )
        db.add(contact)

    db.commit()
    db.refresh(contact)

    # Fire-and-forget CRM syncs + n8n notification
    asyncio.create_task(_sync_to_crms(db, contact, is_new))

    return contact


async def _sync_to_crms(db: Session, contact: Contact, is_new: bool) -> None:
    """Pushes to HubSpot and Zoho in parallel, saves back the external IDs."""
    hubspot_id, zoho_id = await asyncio.gather(
        hubspot_service.push_contact(
            phone=contact.phone_number,
            first_name=contact.first_name,
            last_name=contact.last_name,
            email=contact.email,
            intent=contact.last_intent,
            urgency=contact.last_urgency,
        ),
        zoho_service.push_lead(
            phone=contact.phone_number,
            first_name=contact.first_name,
            last_name=contact.last_name,
            email=contact.email,
            intent=contact.last_intent,
            urgency=contact.last_urgency,
            summary=contact.last_summary,
        ),
    )

    try:
        if hubspot_id:
            contact.crm_hubspot_id = hubspot_id
        if zoho_id:
            contact.crm_zoho_id = zoho_id
        if hubspot_id or zoho_id:
            db.commit()
    except Exception:
        pass

    # Notify n8n if a webhook URL is configured and this is a new contact
    if is_new and settings.n8n_new_lead_webhook:
        await _notify_n8n(contact)


async def _notify_n8n(contact: Contact) -> None:
    payload = {
        "event":        "new_lead",
        "contact_id":   contact.id,
        "client_id":    contact.client_id,
        "phone":        contact.phone_number,
        "email":        contact.email,
        "name":         f"{contact.first_name} {contact.last_name}".strip(),
        "source":       contact.source,
        "intent":       contact.last_intent,
        "urgency":      contact.last_urgency,
        "summary":      contact.last_summary,
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(settings.n8n_new_lead_webhook, json=payload)
    except Exception as exc:
        print(f"[crm] n8n webhook failed: {exc}")
