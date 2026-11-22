import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole:
    FARMER = "FARMER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.FARMER)  # FARMER, BUYER, ADMIN
    
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    produce_listings = relationship("ProduceListing", back_populates="farmer")
    buyer_offers = relationship("BuyerOffer", back_populates="buyer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    farm_name = Column(String(150), nullable=True)
    farm_location = Column(String(255), nullable=True)
    cultivated_crops = Column(String(255), nullable=True)  # e.g., "Paddy, Cotton, Chilli, Tomato"
    farm_size_acres = Column(Numeric(6, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="farmer_profile")

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name = Column(String(200), nullable=False)
    business_type = Column(String(100), nullable=False)  # Wholesaler, Retailer, Supermarket, Processing Co, Restaurant, Consumer
    business_address = Column(Text, nullable=True)
    buyer_category = Column(String(100), nullable=True)  # B2B, Institutional, Retail
    is_verified = Column(Boolean, default=False)
    rating = Column(Numeric(3, 2), default=4.80)
    total_deals_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="buyer_profile")
    verifications = relationship("BuyerVerification", back_populates="buyer", cascade="all, delete-orphan")

class BuyerVerification(Base):
    __tablename__ = "buyer_verifications"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyer_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False)  # GSTIN, APMC Trader License, FSSAI, Trade License
    document_number = Column(String(100), nullable=False)
    document_url = Column(String(500), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED
    admin_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    buyer = relationship("BuyerProfile", back_populates="verifications")
