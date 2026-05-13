from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.contact import Contact
from ..services import crm_service
from ..utils.auth import require_any_auth

router = APIRouter(prefix="/contacts", tags=["contacts"])


class ContactCreate(BaseModel):
    client_id:    str
    phone_number: str = ""
    email:        str = ""
    first_name:   str = ""
    last_name:    str = ""
    notes:        str = ""
    tags:         str = ""
    source:       str = "manual"


class ContactUpdate(BaseModel):
    first_name:  Optional[str] = None
    last_name:   Optional[str] = None
    email:       Optional[str] = None
    phone_number: Optional[str] = None
    status:      Optional[str] = None
    notes:       Optional[str] = None
    tags:        Optional[str] = None


@router.get("")
def list_contacts(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    q = db.query(Contact)
    if client_id:
        q = q.filter(Contact.client_id == client_id)
    if status:
        q = q.filter(Contact.status == status)
    return q.order_by(Contact.updated_at.desc()).all()


@router.get("/{contact_id}")
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    return c


@router.post("", status_code=201)
async def create_contact(
    body: ContactCreate,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    display_name = f"{body.first_name} {body.last_name}".strip()
    return await crm_service.upsert_contact(
        db=db,
        client_id=body.client_id,
        phone=body.phone_number,
        email=body.email,
        display_name=display_name,
        source=body.source,
    )


@router.patch("/{contact_id}")
def update_contact(
    contact_id: str,
    body: ContactUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{contact_id}", status_code=204)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    db.delete(c)
    db.commit()


@router.post("/{contact_id}/sync")
async def sync_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    """Manually re-push a contact to HubSpot and Zoho."""
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    await crm_service._sync_to_crms(db, c, is_new=False)
    db.refresh(c)
    return {
        "hubspot_id": c.crm_hubspot_id,
        "zoho_id": c.crm_zoho_id,
    }
