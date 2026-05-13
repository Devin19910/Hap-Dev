from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.client import Client
from ..models.subscription import Subscription, TIERS
from ..utils.auth import require_any_auth as require_api_key

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    tier: str = "free"


@router.post("")
def create_client(
    body: ClientCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    if db.query(Client).filter(Client.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    if body.tier not in TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Choose from: {list(TIERS)}")

    client = Client(name=body.name, email=body.email)
    db.add(client)
    db.flush()

    sub = Subscription(
        client_id=client.id,
        tier=body.tier,
        monthly_limit=TIERS[body.tier],
    )
    db.add(sub)
    db.commit()
    db.refresh(client)

    return {"client": client, "api_key": client.api_key}


@router.get("")
def list_clients(db: Session = Depends(get_db), _: str = Depends(require_api_key)):
    return db.query(Client).filter(Client.is_active == True).all()


@router.get("/{client_id}")
def get_client(client_id: str, db: Session = Depends(get_db), _: str = Depends(require_api_key)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.delete("/{client_id}")
def deactivate_client(
    client_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client.is_active = False
    db.commit()
    return {"detail": "Client deactivated"}
