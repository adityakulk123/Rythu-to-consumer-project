from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    mobile_number: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class UserLogin(BaseModel):
    mobile_or_email: str
    password: str

class FarmerRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    village: str
    district: str
    state: str
    pincode: str
    
    # Farmer specific
    farm_name: str = Field(..., min_length=2)
    farm_location: str
    crops_cultivated: str
    farm_size_acres: Optional[float] = None
    experience_years: Optional[int] = None
    organic_certified: bool = False

class BuyerRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    village: str
    district: str
    state: str
    pincode: str
    
    # Buyer specific
    business_name: str = Field(..., min_length=2)
    business_type: str  # Wholesaler, Retailer, Supermarket, Hotel/Restaurant, Food Processor, Individual Consumer
    business_address: str
    buyer_category: str
    gstin_pan: Optional[str] = None

class FarmerProfileResponse(BaseModel):
    id: int
    farm_name: str
    farm_location: str
    crops_cultivated: str
    farm_size_acres: Optional[float] = None
    experience_years: Optional[int] = None
    organic_certified: bool = False
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class BuyerProfileResponse(BaseModel):
    id: int
    business_name: str
    business_type: str
    business_address: str
    buyer_category: str
    gstin_pan: Optional[str] = None
    verification_status: str
    verification_notes: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    full_name: str
    mobile_number: str
    email: Optional[str] = None
    role: str
    village: str
    district: str
    state: str
    pincode: str
    is_active: bool
    created_at: datetime
    farmer_profile: Optional[FarmerProfileResponse] = None
    buyer_profile: Optional[BuyerProfileResponse] = None

    class Config:
        from_attributes = True
