import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from .base import Base

TIERS = {"free": 50, "basic": 500, "pro": 5000}


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    tier = Column(String, default="free")          # free | basic | pro
    monthly_limit = Column(Integer, default=50)    # AI requests per month
    requests_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    renewed_at = Column(DateTime, default=datetime.utcnow)
