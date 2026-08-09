import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.worker import Worker
from models.decision import Decision
from db import get_db
from utils.audit import log_action

router = APIRouter()


class DecisionRequest(BaseModel):
    gigtrust_id: str
    decision: str          # "APPROVE" or "REJECT"
    sanctioned_amount: float | None = None
    officer: str


class DecisionResponse(BaseModel):
    status: str
    decision_id: str


@router.post("/decision", response_model=DecisionResponse)
def record_decision(payload: DecisionRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.gigtrust_id == payload.gigtrust_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if payload.decision.upper() not in ("APPROVE", "REJECT"):
        raise HTTPException(status_code=400, detail="decision must be APPROVE or REJECT")

    decision_id = f"DEC-{uuid.uuid4().hex[:5].upper()}"

    decision = Decision(
        id=decision_id,
        gigtrust_id=payload.gigtrust_id,
        decision=payload.decision.upper(),
        sanctioned_amount=payload.sanctioned_amount,
        officer=payload.officer,
        timestamp=datetime.utcnow()
    )
    db.add(decision)
    db.commit()
    log_action(db, endpoint="/decision", action=f"{payload.decision.upper()} recorded for {payload.gigtrust_id}", user=payload.officer)

    return {"status": "recorded", "decision_id": decision_id}
