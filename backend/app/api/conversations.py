from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.whatsapp_conversation import WhatsAppConversation
from ..utils.auth import require_any_auth

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("")
def list_conversations(
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    return db.query(WhatsAppConversation).order_by(
        WhatsAppConversation.updated_at.desc()
    ).all()


@router.get("/{client_id}")
def conversations_by_client(
    client_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    return db.query(WhatsAppConversation).filter(
        WhatsAppConversation.client_id == client_id
    ).order_by(WhatsAppConversation.updated_at.desc()).all()
