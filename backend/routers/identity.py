from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas.identity import IdentityRequest, IdentityResponse
from utils.id_generator import generate_gigtrust_id
from models.worker import Worker
from db import get_db

router = APIRouter()

@router.post("/identity", response_model=IdentityResponse)
def create_identity(payload: IdentityRequest, db: Session = Depends(get_db)):
    existing = db.query(Worker).filter(Worker.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Worker already registered")

    gigtrust_id = generate_gigtrust_id()
    worker = Worker(gigtrust_id=gigtrust_id, name=payload.name, phone=payload.phone)
    db.add(worker)
    db.commit()
    return {"gigtrust_id": gigtrust_id}
