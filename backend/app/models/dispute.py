from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    against_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Types: 'incorrect_weight', 'quality_deductions', 'damaged_produce', 'quantity_mismatch', 'non_payment', 'delivery_problems', 'other'
    dispute_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    evidence_photos = Column(Text, nullable=True)
    
    # Status: 'open', 'under_investigation', 'resolved', 'closed'
    status = Column(String(30), default="open", index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="disputes")
    raised_by = relationship("User", foreign_keys=[raised_by_id])
    against_user = relationship("User", foreign_keys=[against_user_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
