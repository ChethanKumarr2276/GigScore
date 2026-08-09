from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from db import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint = Column(String, nullable=False)
    action = Column(String, nullable=False)
    user = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
