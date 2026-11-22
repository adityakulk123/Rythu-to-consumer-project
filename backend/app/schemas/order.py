from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field

class WeighmentRecordCreate(BaseModel):
    gross_weight: float = Field(..., gt=0)
    packaging_weight: float = Field(0.0, ge=0)
    accepted_quantity: float = Field(..., gt=0)
    rejected_quantity: float = Field(0.0, ge=0)
    rejection_reason: Optional[str] = None
    scale_type: str = "Certified Digital Platform Scale"
    weighment_slip_photo_url: Optional[str] = None
    produce_photo_url: Optional[str] = None

class QualityAssessmentCreate(BaseModel):
    grade: str
    moisture_content_pct: Optional[float] = None
    foreign_matter_pct: Optional[float] = None
    damage_rot_pct: Optional[float] = None
    notes: Optional[str] = None
    photos: Optional[str] = None

class WeighmentRecordResponse(BaseModel):
    id: int
    order_id: int
    original_listing_quantity: float
    gross_weight: float
    packaging_weight: float
    net_weight: float
    accepted_quantity: float
    rejected_quantity: float
    rejection_reason: Optional[str] = None
    agreed_price: float
    calculated_final_amount: float
    scale_type: str
    weighment_slip_photo_url: Optional[str] = None
    produce_photo_url: Optional[str] = None
    farmer_confirmed: bool
    farmer_confirmed_at: Optional[datetime] = None
    buyer_confirmed: bool
    buyer_confirmed_at: Optional[datetime] = None
    verification_timestamp: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QualityAssessmentResponse(BaseModel):
    id: int
    order_id: int
    assessed_by: str
    grade: str
    moisture_content_pct: Optional[float] = None
    foreign_matter_pct: Optional[float] = None
    damage_rot_pct: Optional[float] = None
    notes: Optional[str] = None
    photos: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class OrderCreateFromOffer(BaseModel):
    offer_id: int
    delivery_address: str
    estimated_delivery_date: date

class OrderResponse(BaseModel):
    id: int
    order_number: str
    offer_id: Optional[int] = None
    produce_id: int
    farmer_id: int
    buyer_id: int
    
    quantity: float
    agreed_price_per_unit: float
    initial_total_amount: float
    final_payable_amount: Optional[float] = None
    
    delivery_method: str
    delivery_address: str
    estimated_delivery_date: date
    status: str
    payment_status: str
    advance_amount_paid: float
    status_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    weighment_record: Optional[WeighmentRecordResponse] = None
    quality_assessment: Optional[QualityAssessmentResponse] = None

    class Config:
        from_attributes = True
