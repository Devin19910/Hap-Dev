import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime
from .base import Base


class CallLog(Base):
    __tablename__ = "call_logs"

    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id        = Column(String, nullable=False, index=True)
    contact_id       = Column(String, default="", nullable=True)
    phone_number     = Column(String, default="", index=True)
    direction        = Column(String, default="outbound")   # inbound | outbound
    status           = Column(String, default="queued")     # queued | ringing | in-progress | completed | failed | no-answer
    duration_seconds = Column(Integer, default=0)
    transcript       = Column(Text, default="")
    recording_url    = Column(String, default="")
    vapi_call_id     = Column(String, default="", index=True)
    ended_reason     = Column(String, default="")
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
