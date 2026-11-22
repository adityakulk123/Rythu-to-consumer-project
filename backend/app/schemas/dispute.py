from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DisputeCreate(BaseModel):
    order_id: int
    against_user_id: int
    dispute_type: str  # 'incorrect_weight', 'quality_deductions', 'damaged_produce', 'quantity_mismatch', 'non_payment', 'delivery_problems', 'other'
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    evidence_photos: Optional[str] = None

class DisputeResolve(BaseModel):
    status: str = "resolved"  # 'resolved', 'closed', 'under_investigation'
    resolution_notes: str

class DisputeResponse(BaseModel):
    id: int
    order_id: int
    raised_by_id: int
    against_user_id: int
    dispute_type: str
    title: str
    description: str
    evidence_photos: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
