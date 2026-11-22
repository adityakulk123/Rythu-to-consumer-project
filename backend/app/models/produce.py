from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class CropCategory(Base):
    __tablename__ = "crop_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), nullable=True)  # Lucide icon name or emoji
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    listings = relationship("ProduceListing", back_populates="category")


class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("crop_categories.id"), nullable=False, index=True)
    
    crop_name = Column(String(150), nullable=False, index=True)
    variety = Column(String(100), nullable=True)
    total_quantity = Column(Float, nullable=False)
    available_quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg", nullable=False)  # 'kg', 'quintal', 'tonne'
    
    asking_price_per_unit = Column(Float, nullable=False)
    min_acceptable_price = Column(Float, nullable=False)  # SENSITIVE: Private to farmer, strictly hidden from buyers
    
    harvest_date = Column(Date, nullable=False)
    available_until = Column(Date, nullable=False)
    quality_grade = Column(String(50), nullable=False)  # 'Grade A', 'Grade B', 'Grade C', 'Organic Premium'
    description = Column(Text, nullable=True)
    
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    delivery_options = Column(String(50), default="both")  # 'pickup_only', 'delivery_available', 'both'
    
    status = Column(String(30), default="active", index=True)  # 'active', 'partially_sold', 'sold_out', 'paused', 'expired'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("User", back_populates="produce_listings", foreign_keys=[farmer_id])
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
    caption = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    produce = relationship("ProduceListing", back_populates="images")
