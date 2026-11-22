from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class BuyerOffer(Base):
    __tablename__ = "buyer_offers"

    id = Column(Integer, primary_key=True, index=True)
    produce_id = Column(Integer, ForeignKey("produce_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    requested_quantity = Column(Float, nullable=False)
    offered_price_per_unit = Column(Float, nullable=False)
    total_offer_value = Column(Float, nullable=False)  # requested_quantity * offered_price_per_unit
    
    preferred_delivery_date = Column(Date, nullable=False)
    delivery_method = Column(String(50), nullable=False)  # 'Buyer Pickup', 'Farmer Delivery'
    additional_requirements = Column(Text, nullable=True)
    
    # Status: 'pending', 'countered', 'accepted', 'rejected', 'expired', 'converted_to_order'
    status = Column(String(30), default="pending", index=True)
    
    # Current active negotiated terms (updated when counter-offers are agreed)
    current_agreed_price = Column(Float, nullable=True)
    current_agreed_quantity = Column(Float, nullable=True)
    
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    produce = relationship("ProduceListing", back_populates="offers")
    buyer = relationship("User", back_populates="offers_made", foreign_keys=[buyer_id])
    negotiation_history = relationship("OfferNegotiation", back_populates="offer", cascade="all, delete-orphan", order_by="OfferNegotiation.created_at.asc()")
    order = relationship("Order", back_populates="offer", uselist=False)


class OfferNegotiation(Base):
    __tablename__ = "offer_negotiations"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("buyer_offers.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Either farmer or buyer
    
    counter_price_per_unit = Column(Float, nullable=False)
    counter_quantity = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    
    # Status: 'proposed', 'accepted', 'rejected'
    status = Column(String(20), default="proposed")
    created_at = Column(DateTime, default=datetime.utcnow)

    offer = relationship("BuyerOffer", back_populates="negotiation_history")
    sender = relationship("User")
