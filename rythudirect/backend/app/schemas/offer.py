from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field

class OfferCreate(BaseModel):
    produce_id: int
    quantity: Decimal = Field(..., gt=0)
    offered_price_per_kg: Decimal = Field(..., gt=0)
    preferred_delivery_date: Optional[date] = None
    delivery_method: str = "PICKUP" # PICKUP, DELIVERY
    additional_requirements: Optional[str] = None

class OfferCounterCreate(BaseModel):
    counter_price_per_kg: Decimal = Field(..., gt=0)
    counter_quantity: Optional[Decimal] = Field(None, gt=0)
    notes: Optional[str] = None

class NegotiationResponse(BaseModel):
    id: int
    offer_id: int
    sender_id: int
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    counter_price_per_kg: Decimal
    counter_quantity: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BuyerBasicInfo(BaseModel):
    id: int
    full_name: str
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    is_verified: bool = False
    rating: Optional[Decimal] = None
    district: Optional[str] = None

class OfferResponse(BaseModel):
    id: int
    produce_id: int
    crop_name: Optional[str] = None
    buyer_id: int
    quantity: Decimal
    offered_price_per_kg: Decimal
    preferred_delivery_date: Optional[date] = None
    delivery_method: str
    additional_requirements: Optional[str] = None
    status: str # PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED, CANCELLED
    created_at: datetime
    updated_at: datetime
    buyer: Optional[BuyerBasicInfo] = None
    negotiations: List[NegotiationResponse] = []
    farmer_id: Optional[int] = None
    farmer_name: Optional[str] = None
    produce_remaining_quantity: Optional[Decimal] = None
    produce_expected_price: Optional[Decimal] = None

    class Config:
        from_attributes = True
