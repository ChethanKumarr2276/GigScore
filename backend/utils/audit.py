from sqlalchemy.orm import Session
from models.audit_log import AuditLog

def log_action(db: Session, endpoint: str, action: str, user: str = "system"):
    entry = AuditLog(endpoint=endpoint, action=action, user=user)
    db.add(entry)
    db.commit()
