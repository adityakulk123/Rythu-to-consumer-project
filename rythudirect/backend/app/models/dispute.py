import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # INCORRECT_WEIGHT, UNFAIR_QUALITY_DEDUCTION, DAMAGED_PRODUCE, QUANTITY_MISMATCH, NON_PAYMENT, DELIVERY_ISSUES, OTHER
    reason = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    evidence_urls = Column(Text, nullable=True)  # Comma-separated or JSON list
    
    # OPEN, UNDER_INVESTIGATION, RESOLVED, REJECTED
    status = Column(String(40), default="OPEN", index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="disputes")
    raised_by = relationship("User", foreign_keys=[raised_by_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
