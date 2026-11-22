import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class BuyerOffer(Base):
    __tablename__ = "buyer_offers"

    id = Column(Integer, primary_key=True, index=True)
    produce_id = Column(Integer, ForeignKey("produce_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity = Column(Numeric(12, 2), nullable=False)  # in KG
    offered_price_per_kg = Column(Numeric(10, 2), nullable=False)
    preferred_delivery_date = Column(Date, nullable=True)
    delivery_method = Column(String(50), default="PICKUP")  # PICKUP, DELIVERY
    additional_requirements = Column(Text, nullable=True)
    
    # Status: PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED, CANCELLED
    status = Column(String(30), default="PENDING", index=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    produce = relationship("ProduceListing", back_populates="offers")
    buyer = relationship("User", back_populates="buyer_offers")
    negotiations = relationship("OfferNegotiation", back_populates="offer", cascade="all, delete-orphan", order_by="OfferNegotiation.created_at")
    order = relationship("Order", back_populates="offer", uselist=False)

class OfferNegotiation(Base):
    __tablename__ = "offer_negotiations"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("buyer_offers.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    counter_price_per_kg = Column(Numeric(10, 2), nullable=False)
    counter_quantity = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    offer = relationship("BuyerOffer", back_populates="negotiations")
    sender = relationship("User")
