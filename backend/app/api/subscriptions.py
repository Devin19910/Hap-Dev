from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.subscription import Subscription, TIERS
from ..utils.auth import require_api_key

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class TierUpgrade(BaseModel):
    tier: str


@router.get("/{client_id}")
def get_subscription(
    client_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    sub = db.query(Subscription).filter(Subscription.client_id == client_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {
        "tier": sub.tier,
        "monthly_limit": sub.monthly_limit,
        "requests_used": sub.requests_used,
        "remaining": sub.monthly_limit - sub.requests_used,
        "is_active": sub.is_active,
    }


@router.patch("/{client_id}/upgrade")
def upgrade_subscription(
    client_id: str,
    body: TierUpgrade,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    if body.tier not in TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Choose from: {list(TIERS)}")

    sub = db.query(Subscription).filter(Subscription.client_id == client_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.tier = body.tier
    sub.monthly_limit = TIERS[body.tier]
    db.commit()
    return {"detail": f"Upgraded to {body.tier}", "new_limit": sub.monthly_limit}


@router.post("/{client_id}/reset")
def reset_usage(
    client_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    sub = db.query(Subscription).filter(Subscription.client_id == client_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.requests_used = 0
    db.commit()
    return {"detail": "Usage reset"}
