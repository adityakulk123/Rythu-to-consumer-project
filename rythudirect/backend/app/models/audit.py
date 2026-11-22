import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE_OFFER, ACCEPT_OFFER, CONFIRM_WEIGHMENT, UPDATE_PAYMENT, RAISE_DISPUTE
    entity_type = Column(String(50), nullable=False) # Offer, Order, ProduceListing, WeighmentRecord
    entity_id = Column(Integer, nullable=False)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
