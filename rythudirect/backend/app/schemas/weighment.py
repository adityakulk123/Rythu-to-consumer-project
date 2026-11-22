from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class WeighmentCreate(BaseModel):
    gross_weight: Decimal = Field(..., gt=0)
    packaging_weight: Decimal = Field(..., ge=0)
    rejected_quantity: Decimal = Field(0.0, ge=0)
    quality_grade: Optional[str] = "Grade A"
    scale_slip_number: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    notes: Optional[str] = None

class WeighmentConfirm(BaseModel):
    confirm: bool = True
    notes: Optional[str] = None

class WeighmentResponse(BaseModel):
    id: int
    order_id: int
    original_listed_quantity: Decimal
    gross_weight: Decimal
    packaging_weight: Decimal
    net_weight: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal
    agreed_price_per_kg: Decimal
    final_payable_amount: Decimal
    quality_grade: Optional[str] = None
    scale_slip_number: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    farmer_confirmed: bool
    farmer_confirmed_at: Optional[datetime] = None
    buyer_confirmed: bool
    buyer_confirmed_at: Optional[datetime] = None
    verification_timestamp: datetime
    notes: Optional[str] = None
    created_at: datetime
    is_fully_confirmed: bool = False

    class Config:
        from_attributes = True

class QualityAssessmentCreate(BaseModel):
    grade_assessed: str
    moisture_content: Optional[Decimal] = None
    foreign_matter_pct: Optional[Decimal] = None
    damage_pct: Optional[Decimal] = None
    assessor_notes: Optional[str] = None
    photos_url: Optional[str] = None

class QualityAssessmentResponse(QualityAssessmentCreate):
    id: int
    order_id: int
    created_at: datetime

    class Config:
        from_attributes = True
