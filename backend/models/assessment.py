from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
from db import Base

class Assessment(Base):
    __tablename__ = "assessments"
    gigtrust_id = Column(String, primary_key=True)
    grs = Column(Float, nullable=True)
    grs_band = Column(String, nullable=True)
    financial_assessment = Column(String, nullable=True)
    pd = Column(Float, nullable=True)
    p_approve = Column(Float, nullable=True)
    interest_rate = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)
    evidence_quality = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
