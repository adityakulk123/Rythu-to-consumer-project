from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PaymentProcessRequest(BaseModel):
    order_id: int
    amount: float = Field(..., gt=0)
    payment_stage: str = "full"  # 'advance', 'final_balance', 'full'
    payment_method: str = "upi"  # 'upi', 'bank_transfer', 'escrow_wallet', 'cash_on_delivery'
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payer_id: int
    payee_id: int
    amount: float
    payment_stage: str
    payment_method: str
    transaction_reference: str
    receipt_number: str
    is_demo: bool
    demo_badge_text: str
    status: str
    notes: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
