import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    produce_id = Column(Integer, ForeignKey("produce_listings.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    offer_id = Column(Integer, ForeignKey("buyer_offers.id"), nullable=True)
    
    agreed_quantity = Column(Numeric(12, 2), nullable=False)  # in KG
    agreed_price_per_kg = Column(Numeric(10, 2), nullable=False)
    total_estimated_amount = Column(Numeric(14, 2), nullable=False)
    
    # Status: CONFIRMED, WEIGHMENT_PENDING, WEIGHMENT_COMPLETED, DELIVERED, COMPLETED, CANCELLED, DISPUTED
    status = Column(String(40), default="CONFIRMED", index=True)
    
    delivery_method = Column(String(50), default="PICKUP")
    delivery_address = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    produce = relationship("ProduceListing", back_populates="orders")
    farmer = relationship("User", foreign_keys=[farmer_id])
    buyer = relationship("User", foreign_keys=[buyer_id])
    offer = relationship("BuyerOffer", back_populates="order")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    weighment_record = relationship("WeighmentRecord", back_populates="order", uselist=False, cascade="all, delete-orphan")
    quality_assessment = relationship("QualityAssessment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    payment_transaction = relationship("PaymentTransaction", back_populates="order", uselist=False, cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(150), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    price_per_kg = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(14, 2), nullable=False)

    order = relationship("Order", back_populates="items")
