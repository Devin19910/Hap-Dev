from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.whatsapp_conversation import WhatsAppConversation
from ..utils.auth import require_any_auth, get_tenant_scope

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("")
def list_conversations(
    scope: Optional[str] = Depends(get_tenant_scope),
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    q = db.query(WhatsAppConversation)
    if scope:
        q = q.filter(WhatsAppConversation.client_id == scope)
    return q.order_by(WhatsAppConversation.updated_at.desc()).all()


@router.get("/{client_id}")
def conversations_by_client(
    client_id: str,
    scope: Optional[str] = Depends(get_tenant_scope),
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    effective_id = scope or client_id
    return db.query(WhatsAppConversation).filter(
        WhatsAppConversation.client_id == effective_id
    ).order_by(WhatsAppConversation.updated_at.desc()).all()
