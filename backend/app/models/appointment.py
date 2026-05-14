import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from .base import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id        = Column(String, nullable=False, index=True)
    contact_id       = Column(String, default="")
    phone_number     = Column(String, default="", index=True)
    customer_name    = Column(String, default="")
    service          = Column(String, default="")          # e.g. "haircut", "dental checkup"
    notes            = Column(Text, default="")            # raw customer message
    requested_at_text = Column(String, default="")         # e.g. "tomorrow 3pm", "next Monday"
    scheduled_at     = Column(DateTime, nullable=True)     # confirmed datetime set by operator
    duration_minutes = Column(Integer, default=60)
    status           = Column(String, default="pending")   # pending | confirmed | completed | cancelled
    google_event_id  = Column(String, default="")
    reminder_sent    = Column(Boolean, default=False)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
