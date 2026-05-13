import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from .base import Base


class WhatsAppConversation(Base):
    __tablename__ = "whatsapp_conversations"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number    = Column(String, nullable=False, index=True)
    client_id       = Column(String, nullable=False)   # which client "owns" this WhatsApp line
    display_name    = Column(String, default="")
    last_message    = Column(Text, default="")
    last_reply      = Column(Text, default="")
    last_intent     = Column(String, default="")       # booking|complaint|etc
    message_count   = Column(String, default="0")      # stored as string for SQLite compat
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
