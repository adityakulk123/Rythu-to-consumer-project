from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class FarmerRegisterExtra(BaseModel):
    farm_name: Optional[str] = None
    farm_location: Optional[str] = None
    cultivated_crops: Optional[str] = None
    farm_size_acres: Optional[Decimal] = None

class BuyerRegisterExtra(BaseModel):
    business_name: str = Field(..., min_length=2)
    business_type: str = Field(..., min_length=2) # Wholesaler, Retailer, Supermarket, Processing Co, Restaurant, Consumer
    business_address: Optional[str] = None
    buyer_category: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    document_url: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(FARMER|BUYER)$") # NEVER ALLOW ADMIN VIA PUBLIC REGISTER!
    farmer_details: Optional[FarmerRegisterExtra] = None
    buyer_details: Optional[BuyerRegisterExtra] = None

class LoginRequest(BaseModel):
    mobile_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str
    is_verified: bool = False

class FarmerProfileResponse(BaseModel):
    id: int
    farm_name: Optional[str] = None
    farm_location: Optional[str] = None
    cultivated_crops: Optional[str] = None
    farm_size_acres: Optional[Decimal] = None

    class Config:
        from_attributes = True

class BuyerVerificationResponse(BaseModel):
    id: int
    document_type: str
    document_number: str
    document_url: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BuyerProfileResponse(BaseModel):
    id: int
    business_name: str
    business_type: str
    business_address: Optional[str] = None
    buyer_category: Optional[str] = None
    is_verified: bool
    rating: Decimal
    total_deals_completed: int
    verifications: List[BuyerVerificationResponse] = []

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    farmer_profile: Optional[FarmerProfileResponse] = None
    buyer_profile: Optional[BuyerProfileResponse] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    farmer_details: Optional[FarmerRegisterExtra] = None
    buyer_details: Optional[BuyerRegisterExtra] = None
