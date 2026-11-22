import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class CropCategory(Base):
    __tablename__ = "crop_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # icon name or emoji
    is_active = Column(Boolean, default=True)

    listings = relationship("ProduceListing", back_populates="category")

class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("crop_categories.id"), nullable=False)
    
    crop_name = Column(String(150), nullable=False, index=True)
    quantity = Column(Numeric(12, 2), nullable=False)  # Total original quantity
    unit = Column(String(20), default="KG")  # KG, TONNES, QUINTALS, BAGS
    remaining_quantity = Column(Numeric(12, 2), nullable=False)  # Updated atomically on confirmed deals
    
    expected_price_per_kg = Column(Numeric(10, 2), nullable=False)
    min_acceptable_price = Column(Numeric(10, 2), nullable=False)  # STRICTLY PRIVATE to the farmer
    
    harvest_date = Column(Date, nullable=False)
    available_until = Column(Date, nullable=False)
    quality_grade = Column(String(50), default="Grade A")  # Grade A (Export), Grade B (Standard), Grade C (Processing)
    description = Column(Text, nullable=True)
    
    village = Column(String(100), nullable=True)
    delivery_location = Column(String(255), nullable=True)
    delivery_available = Column(Boolean, default=False)
    pickup_available = Column(Boolean, default=True)
    
    # ACTIVE, PARTIALLY_SOLD, SOLD_OUT, EXPIRED, PAUSED
    status = Column(String(30), default="ACTIVE", index=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    farmer = relationship("User", back_populates="produce_listings")
    category = relationship("CropCategory", back_populates="listings")
    images = relationship("ProduceImage", back_populates="produce", cascade="all, delete-orphan")
    offers = relationship("BuyerOffer", back_populates="produce", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="produce")

class ProduceImage(Base):
    __tablename__ = "produce_images"

    id = Column(Integer, primary_key=True, index=True)
    produce_id = Column(Integer, ForeignKey("produce_listings.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)

    produce = relationship("ProduceListing", back_populates="images")
