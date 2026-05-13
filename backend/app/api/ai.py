from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..models.automation_job import AutomationJob
from ..models.subscription import Subscription
from ..services import ai_router
from ..utils.auth import require_api_key, require_any_auth

router = APIRouter(prefix="/ai", tags=["ai"])


class CompletionRequest(BaseModel):
    client_id: str
    prompt: str
    provider: str = ""   # openai | claude | gemini  (empty = use default)
    system: str = ""


@router.post("/complete")
async def complete(
    body: CompletionRequest,
    db: Session = Depends(get_db),
    _: str = Depends(require_api_key),
):
    sub = db.query(Subscription).filter(
        Subscription.client_id == body.client_id,
        Subscription.is_active == True,
    ).first()

    if not sub:
        raise HTTPException(status_code=403, detail="No active subscription found")

    if sub.requests_used >= sub.monthly_limit:
        raise HTTPException(status_code=429, detail="Monthly request limit reached")

    job = AutomationJob(
        client_id=body.client_id,
        provider=body.provider or "claude",
        prompt=body.prompt,
        status="pending",
    )
    db.add(job)
    db.commit()

    try:
        result = await ai_router.run(body.prompt, provider=body.provider, system=body.system)
        job.response = result["text"]
        job.tokens_used = result["tokens_used"]
        job.status = "done"
        job.completed_at = datetime.utcnow()
        sub.requests_used += 1
        db.commit()
        return {"job_id": job.id, **result}
    except Exception as e:
        job.status = "failed"
        job.response = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{client_id}")
async def list_jobs(
    client_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_any_auth),
):
    jobs = db.query(AutomationJob).filter(AutomationJob.client_id == client_id).all()
    return jobs
