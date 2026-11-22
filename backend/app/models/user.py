from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'farmer', 'buyer', 'admin'
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    produce_listings = relationship("ProduceListing", back_populates="farmer", foreign_keys="[ProduceListing.farmer_id]")
    offers_made = relationship("BuyerOffer", back_populates="buyer", foreign_keys="[BuyerOffer.buyer_id]")
    orders_as_farmer = relationship("Order", back_populates="farmer", foreign_keys="[Order.farmer_id]")
    orders_as_buyer = relationship("Order", back_populates="buyer", foreign_keys="[Order.buyer_id]")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    farm_name = Column(String(150), nullable=False)
    farm_location = Column(String(255), nullable=False)
    crops_cultivated = Column(String(255), nullable=False)  # e.g. "Tomatoes, Rice, Chillies"
    farm_size_acres = Column(Float, nullable=True)
    experience_years = Column(Integer, nullable=True)
    organic_certified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="farmer_profile")


class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name = Column(String(150), nullable=False)
    business_type = Column(String(50), nullable=False)  # Wholesaler, Retailer, Supermarket, Hotel/Restaurant, Food Processor, Individual Consumer
    business_address = Column(Text, nullable=False)
    buyer_category = Column(String(50), nullable=False)  # Bulk Trader, Retail Outlet, Hospitality, Processing
    gstin_pan = Column(String(50), nullable=True)
    verification_status = Column(String(20), default="pending")  # 'pending', 'verified', 'rejected'
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="buyer_profile")
    verifications = relationship("BuyerVerification", back_populates="buyer_profile", cascade="all, delete-orphan")


class BuyerVerification(Base):
    __tablename__ = "buyer_verifications"

    id = Column(Integer, primary_key=True, index=True)
    buyer_profile_id = Column(Integer, ForeignKey("buyer_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False)  # GST Certificate, Trade License, FSSAI, Business PAN, Aadhaar
    document_number = Column(String(100), nullable=False)
    document_url = Column(String(500), nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'approved', 'rejected'
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer_profile = relationship("BuyerProfile", back_populates="verifications")
