import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from .base import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, default="")
    # Platform roles: owner | operator  (tenant_id = null)
    # Tenant roles:   tenant_owner | tenant_operator  (tenant_id = client.id)
    role      = Column(String, default="operator")
    tenant_id = Column(String, nullable=True)   # null = platform admin
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
