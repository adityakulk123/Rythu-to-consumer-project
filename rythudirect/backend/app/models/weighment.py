import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class WeighmentRecord(Base):
    __tablename__ = "weighment_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    original_listed_quantity = Column(Numeric(12, 2), nullable=False)
    gross_weight = Column(Numeric(12, 2), nullable=False)        # Gross scale reading
    packaging_weight = Column(Numeric(12, 2), nullable=False)    # Crates / Bags tare weight
    net_weight = Column(Numeric(12, 2), nullable=False)          # gross_weight - packaging_weight
    
    accepted_quantity = Column(Numeric(12, 2), nullable=False)   # Net accepted quality produce
    rejected_quantity = Column(Numeric(12, 2), default=0.0)      # Rejected / damaged produce
    
    agreed_price_per_kg = Column(Numeric(10, 2), nullable=False)
    final_payable_amount = Column(Numeric(14, 2), nullable=False) # accepted_quantity * agreed_price_per_kg
    
    quality_grade = Column(String(50), nullable=True)            # Certified Grade A, B, C
    scale_slip_number = Column(String(100), nullable=True)       # Certified weighbridge slip ref
    photo_evidence_url = Column(String(500), nullable=True)      # Scale photograph / tare photo
    
    farmer_confirmed = Column(Boolean, default=False)
    farmer_confirmed_at = Column(DateTime, nullable=True)
    
    buyer_confirmed = Column(Boolean, default=False)
    buyer_confirmed_at = Column(DateTime, nullable=True)
    
    verification_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="weighment_record")

class QualityAssessment(Base):
    __tablename__ = "quality_assessments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    grade_assessed = Column(String(50), nullable=False)
    moisture_content = Column(Numeric(5, 2), nullable=True)     # in %
    foreign_matter_pct = Column(Numeric(5, 2), nullable=True)   # in %
    damage_pct = Column(Numeric(5, 2), nullable=True)           # in %
    assessor_notes = Column(Text, nullable=True)
    photos_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="quality_assessment")
