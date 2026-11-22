from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    offer_id = Column(Integer, ForeignKey("buyer_offers.id"), nullable=True)
    produce_id = Column(Integer, ForeignKey("produce_listings.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    quantity = Column(Float, nullable=False)
    agreed_price_per_unit = Column(Float, nullable=False)
    initial_total_amount = Column(Float, nullable=False)
    final_payable_amount = Column(Float, nullable=True)  # Populated after weighment verification
    
    delivery_method = Column(String(50), nullable=False)
    delivery_address = Column(Text, nullable=False)
    estimated_delivery_date = Column(Date, nullable=False)
    
    # Order Status:
    # 'order_confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered',
    # 'verification_pending', 'completed', 'cancelled', 'disputed'
    status = Column(String(50), default="order_confirmed", index=True)
    
    # Payment Status:
    # 'pending', 'advance_paid', 'partially_paid', 'fully_paid', 'overdue', 'disputed', 'refunded'
    payment_status = Column(String(30), default="pending", index=True)
    advance_amount_paid = Column(Float, default=0.0)
    
    status_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    produce = relationship("ProduceListing", back_populates="orders")
    farmer = relationship("User", back_populates="orders_as_farmer", foreign_keys=[farmer_id])
    buyer = relationship("User", back_populates="orders_as_buyer", foreign_keys=[buyer_id])
    offer = relationship("BuyerOffer", back_populates="order")
    weighment_record = relationship("WeighmentRecord", back_populates="order", uselist=False, cascade="all, delete-orphan")
    quality_assessment = relationship("QualityAssessment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    payment_transactions = relationship("PaymentTransaction", back_populates="order", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="order", cascade="all, delete-orphan")


class WeighmentRecord(Base):
    __tablename__ = "weighment_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    original_listing_quantity = Column(Float, nullable=False)
    gross_weight = Column(Float, nullable=False)
    packaging_weight = Column(Float, default=0.0)
    net_weight = Column(Float, nullable=False)  # gross_weight - packaging_weight
    
    accepted_quantity = Column(Float, nullable=False)
    rejected_quantity = Column(Float, default=0.0)
    rejection_reason = Column(Text, nullable=True)
    
    agreed_price = Column(Float, nullable=False)
    calculated_final_amount = Column(Float, nullable=False)  # accepted_quantity * agreed_price
    
    scale_type = Column(String(100), default="APMC Mandi Weighbridge / Certified Digital Scale")
    weighment_slip_photo_url = Column(String(500), nullable=True)
    produce_photo_url = Column(String(500), nullable=True)
    
    farmer_confirmed = Column(Boolean, default=False)
    farmer_confirmed_at = Column(DateTime, nullable=True)
    
    buyer_confirmed = Column(Boolean, default=False)
    buyer_confirmed_at = Column(DateTime, nullable=True)
    
    verification_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="weighment_record")


class QualityAssessment(Base):
    __tablename__ = "quality_assessments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    assessed_by = Column(String(100), default="Buyer Joint Inspection")
    grade = Column(String(50), nullable=False)  # Grade A, Grade B, Grade C
    moisture_content_pct = Column(Float, nullable=True)
    foreign_matter_pct = Column(Float, nullable=True)
    damage_rot_pct = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)  # JSON or comma-separated URLs
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="quality_assessment")
