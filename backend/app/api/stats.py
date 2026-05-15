from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..models.base import get_db
from ..utils.auth import get_current_user, get_tenant_scope
from ..models.admin_user import AdminUser
from ..models.automation_job import AutomationJob
from ..models.appointment import Appointment
from ..models.contact import Contact
from ..models.client import Client

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/value")
def get_value_stats(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
    tenant_id: str | None = Depends(get_tenant_scope),
):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    jobs_q     = db.query(AutomationJob)
    appts_q    = db.query(Appointment)
    contacts_q = db.query(Contact)

    if tenant_id:
        jobs_q     = jobs_q.filter(AutomationJob.client_id == tenant_id)
        appts_q    = appts_q.filter(Appointment.client_id == tenant_id)
        contacts_q = contacts_q.filter(Contact.client_id == tenant_id)

    messages_month  = jobs_q.filter(AutomationJob.created_at >= month_start).count()
    appts_month     = appts_q.filter(Appointment.created_at >= month_start).count()
    leads_month     = contacts_q.filter(Contact.created_at >= month_start).count()

    total_messages  = jobs_q.count()
    total_appts     = appts_q.count()
    total_leads     = contacts_q.count()

    hours_saved = round(messages_month * 5 / 60, 1)

    has_whatsapp = False
    business_type = "general"
    if tenant_id:
        client = db.query(Client).filter(Client.id == tenant_id).first()
        if client:
            has_whatsapp  = bool(client.wa_phone_number_id)
            business_type = client.business_type or "general"

    return {
        "messages_this_month":      messages_month,
        "hours_saved_this_month":   hours_saved,
        "appointments_this_month":  appts_month,
        "leads_this_month":         leads_month,
        "total_messages":           total_messages,
        "total_appointments":       total_appts,
        "total_leads":              total_leads,
        "has_whatsapp":             has_whatsapp,
        "business_type":            business_type,
    }
