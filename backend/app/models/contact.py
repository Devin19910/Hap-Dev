import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from .base import Base


class Contact(Base):
    __tablename__ = "contacts"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id     = Column(String, nullable=False, index=True)
    phone_number  = Column(String, default="", index=True)
    email         = Column(String, default="")
    first_name    = Column(String, default="")
    last_name     = Column(String, default="")
    # Source of the contact record
    source        = Column(String, default="whatsapp")   # whatsapp | manual | import
    # External CRM IDs (populated after sync)
    crm_hubspot_id = Column(String, default="")
    crm_zoho_id    = Column(String, default="")
    # Latest AI triage data from WhatsApp conversation
    last_intent   = Column(String, default="")
    last_urgency  = Column(String, default="")
    last_summary  = Column(Text, default="")
    # Operator-editable fields
    notes         = Column(Text, default="")
    tags          = Column(String, default="")  # comma-separated
    status        = Column(String, default="new")  # new | contacted | qualified | converted | lost
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
