import pandas as pd
import io
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from models.worker import Worker
from utils.id_generator import generate_gigtrust_id
from schemas.identity import IdentityRequest, IdentityResponse
from db import get_db

router = APIRouter()

REQUIRED_COLUMNS = {"name", "phone"}


@router.post("/ingest/csv")
async def ingest_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    if not REQUIRED_COLUMNS.issubset(df.columns):
        return {
            "records_processed": 0,
            "records_failed": len(df),
            "status": "failed",
            "reason": f"CSV must contain columns: {REQUIRED_COLUMNS}"
        }

    processed = 0
    failed = 0

    for _, row in df.iterrows():
        try:
            phone = str(row["phone"]).strip()
            name = str(row["name"]).strip()

            if not phone or not name:
                failed += 1
                continue

            existing = db.query(Worker).filter(Worker.phone == phone).first()
            if existing:
                failed += 1
                continue

            worker = Worker(
                gigtrust_id=generate_gigtrust_id(),
                name=name,
                phone=phone,
                primary_platform=row.get("primary_platform", None)
            )
            db.add(worker)
            processed += 1
        except Exception:
            failed += 1

    db.commit()

    return {
        "records_processed": processed,
        "records_failed": failed,
        "status": "success"
    }


@router.post("/ingest/manual", response_model=IdentityResponse)
def ingest_manual(payload: IdentityRequest, db: Session = Depends(get_db)):
    existing = db.query(Worker).filter(Worker.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Worker already registered")

    gigtrust_id = generate_gigtrust_id()
    worker = Worker(gigtrust_id=gigtrust_id, name=payload.name, phone=payload.phone)
    db.add(worker)
    db.commit()
    return {"gigtrust_id": gigtrust_id}


@router.get("/workers/{gigtrust_id}")
def get_worker(gigtrust_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.gigtrust_id == gigtrust_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {
        "gigtrust_id": worker.gigtrust_id,
        "name": worker.name,
        "phone": worker.phone,
        "primary_platform": worker.primary_platform,
        "created_at": worker.created_at
    }
