import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.worker import Worker
from models.assessment import Assessment
from models.decision import Decision
from ml.predict import generate_financial_assessment
from db import get_db

router = APIRouter()


@router.get("/score/{gigtrust_id}")
def get_score(gigtrust_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.gigtrust_id == gigtrust_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    with open("ml/integration/demo_profiles.json") as f:
        demo_profiles = json.load(f)

    profile_index = hash(gigtrust_id) % len(demo_profiles)
    raw_data = dict(demo_profiles[profile_index])
    raw_data["worker_id"] = worker.gigtrust_id

    result = generate_financial_assessment(raw_data)

    response = {
        "gigtrust_id": gigtrust_id,
        "grs": result["grs"],
        "grs_band": result["grs_band"],
        "financial_assessment": result["financial_assessment"],
        "pd": result["default_probability"],
        "p_approve": result["approval_probability"],
        "max_amount": result["max_amount"],
        "interest_rate": result["interest_rate"],
        "evidence_quality": result["evidence_quality"],
        "top_5_reasons": result["top_5_reasons"],
        "fraud_flag": result["fraud_flag"],
        "worker_summary": result["worker_summary"],
        "lender_summary": result["lender_summary"],
        "coaching_actions": result["coaching_actions"],
        "pillar_scores": result["pillar_scores"],
    }

    existing = db.query(Assessment).filter(Assessment.gigtrust_id == gigtrust_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    assessment = Assessment(
        gigtrust_id=gigtrust_id,
        grs=result["grs"],
        grs_band=result["grs_band"],
        financial_assessment=result["financial_assessment"],
        pd=result["default_probability"],
        p_approve=result["approval_probability"],
        max_amount=result["max_amount"],
        interest_rate=result["interest_rate"],
        evidence_quality=result["evidence_quality"]
    )
    db.add(assessment)
    db.commit()

    return response


@router.get("/worker/{gigtrust_id}")
def get_worker_alias(gigtrust_id: str, db: Session = Depends(get_db)):
    """Alias for the frontend, which calls /worker/{id} (singular)."""
    worker = db.query(Worker).filter(Worker.gigtrust_id == gigtrust_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return {
        "workerId": worker.gigtrust_id,
        "name": worker.name,
        "gigTrustId": worker.gigtrust_id,
        "category": "Ride-Hailing & Delivery Driver",
        "location": "Bengaluru, KA",
        "status": "Verified",
        "primaryPlatform": worker.primary_platform or "Uber Rides",
        "linkedPlatforms": [
            {"id": "uber", "name": "Uber Rides", "earnings": "₹14,200", "syncStatus": "Synced 2h ago", "icon": "🚗"},
            {"id": "zomato", "name": "Zomato Delivery", "earnings": "₹9,850", "syncStatus": "Synced 1h ago", "icon": "🍕"},
            {"id": "swiggy", "name": "Swiggy Instamart", "earnings": "₹7,400", "syncStatus": "Synced 4h ago", "icon": "🛒"},
            {"id": "porter", "name": "Porter Logistics", "earnings": "₹5,600", "syncStatus": "Synced 12h ago", "icon": "📦"},
        ]
    }


@router.get("/applicants")
def get_applicants(db: Session = Depends(get_db)):
    """Real applicant queue for the Lender Portal — replaces the frontend's hardcoded list."""
    workers = db.query(Worker).all()
    results = []

    for worker in workers:
        assessment = db.query(Assessment).filter(Assessment.gigtrust_id == worker.gigtrust_id).first()
        if not assessment:
            continue  # skip workers who haven't been scored yet

        latest_decision = (
            db.query(Decision)
            .filter(Decision.gigtrust_id == worker.gigtrust_id)
            .order_by(Decision.timestamp.desc())
            .first()
        )
        if latest_decision:
            status = "Approved" if latest_decision.decision == "APPROVE" else "Rejected"
        else:
            status = "Pending"

        platforms_count = (hash(worker.gigtrust_id) % 4) + 1  # placeholder until real platform linking exists

        results.append({
            "id": worker.gigtrust_id,
            "gigTrustId": worker.gigtrust_id,
            "name": worker.name,
            "primaryPlatform": worker.primary_platform or "Uber Rides",
            "platformsCount": platforms_count,
            "grsScore": assessment.grs,
            "grsBand": assessment.grs_band,
            "financialAssessment": assessment.financial_assessment,
            "pdRate": f"{(assessment.pd or 0) * 100:.1f}%",
            "requestedAmount": f"₹{int((assessment.max_amount or 0) * 0.7):,}",
            "suggestedAmount": f"₹{int(assessment.max_amount or 0):,}",
            "status": status,
            "submittedDate": worker.created_at.strftime("%d %b %Y") if worker.created_at else "",
        })

    return results
