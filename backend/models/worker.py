from sqlalchemy import Column, String, DateTime
from datetime import datetime
from db import Base

class Worker(Base):
    __tablename__ = "workers"
    gigtrust_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    primary_platform = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
