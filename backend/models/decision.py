from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
from db import Base

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(String, primary_key=True)
    gigtrust_id = Column(String, nullable=False)
    decision = Column(String, nullable=False)
    sanctioned_amount = Column(Float, nullable=True)
    officer = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
