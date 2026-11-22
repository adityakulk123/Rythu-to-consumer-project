from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DisputeCreate(BaseModel):
    order_id: int
    reason: str = Field(..., min_length=3) # INCORRECT_WEIGHT, UNFAIR_QUALITY_DEDUCTION, DAMAGED_PRODUCE, QUANTITY_MISMATCH, NON_PAYMENT, DELIVERY_ISSUES, OTHER
    description: str = Field(..., min_length=10)
    evidence_urls: Optional[str] = None

class DisputeResolve(BaseModel):
    status: str = Field(..., pattern="^(RESOLVED|REJECTED)$")
    resolution_notes: str = Field(..., min_length=5)

class DisputeResponse(BaseModel):
    id: int
    order_id: int
    order_number: Optional[str] = None
    raised_by_id: int
    raised_by_name: Optional[str] = None
    raised_by_role: Optional[str] = None
    reason: str
    description: str
    evidence_urls: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
