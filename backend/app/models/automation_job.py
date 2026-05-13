import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Float, ForeignKey
from .base import Base


class AutomationJob(Base):
    __tablename__ = "automation_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    provider = Column(String, nullable=False)      # openai | claude | gemini
    prompt = Column(Text, nullable=False)
    response = Column(Text)
    tokens_used = Column(Float, default=0)
    status = Column(String, default="pending")     # pending | done | failed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
