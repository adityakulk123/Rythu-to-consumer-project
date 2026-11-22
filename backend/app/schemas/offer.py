from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field

class OfferCreate(BaseModel):
    produce_id: int
    requested_quantity: float = Field(..., gt=0)
    offered_price_per_unit: float = Field(..., gt=0)
    preferred_delivery_date: date
    delivery_method: str = "Buyer Pickup"  # 'Buyer Pickup' or 'Farmer Delivery'
    additional_requirements: Optional[str] = None

class OfferCounter(BaseModel):
    counter_price_per_unit: float = Field(..., gt=0)
    counter_quantity: float = Field(..., gt=0)
    message: Optional[str] = None

class NegotiationMessageResponse(BaseModel):
    id: int
    sender_id: int
    counter_price_per_unit: float
    counter_quantity: float
    message: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BuyerSummary(BaseModel):
    id: int
    full_name: str
    mobile_number: str
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    verification_status: Optional[str] = "pending"
    district: str
    state: str

    class Config:
        from_attributes = True

class ProduceSummary(BaseModel):
    id: int
    crop_name: str
    unit: str
    available_quantity: float
    asking_price_per_unit: float
    quality_grade: str
    district: str
    state: str

    class Config:
        from_attributes = True

class OfferResponse(BaseModel):
    id: int
    produce_id: int
    buyer_id: int
    requested_quantity: float
    offered_price_per_unit: float
    total_offer_value: float
    preferred_delivery_date: date
    delivery_method: str
    additional_requirements: Optional[str] = None
    status: str  # 'pending', 'countered', 'accepted', 'rejected', 'converted_to_order'
    current_agreed_price: Optional[float] = None
    current_agreed_quantity: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    buyer: Optional[BuyerSummary] = None
    produce: Optional[ProduceSummary] = None
    negotiation_history: List[NegotiationMessageResponse] = []

    class Config:
        from_attributes = True
