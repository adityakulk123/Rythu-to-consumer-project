from typing import Optional, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field

class PaymentProcessRequest(BaseModel):
    order_id: int
    payment_type: str = Field("FULL", pattern="^(ADVANCE|FULL|BALANCE)$")
    amount: Optional[Decimal] = None # If None, calculates standard advance (20%) or remaining balance
    payment_method: str = "ESCROW_MOCK" # ESCROW_MOCK, UPI, BANK_TRANSFER, CASH_ON_DELIVERY

class PaymentTransactionResponse(BaseModel):
    id: int
    order_id: int
    transaction_reference: str
    amount: Decimal
    advance_amount: Decimal
    outstanding_balance: Decimal
    payment_status: str
    payment_method: str
    due_date: Optional[date] = None
    confirmed_at: Optional[datetime] = None
    receipt_number: Optional[str] = None
    gateway_response: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReceiptResponse(BaseModel):
    receipt_number: str
    order_number: str
    transaction_reference: str
    farmer_name: str
    buyer_name: str
    crop_name: str
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    outstanding_balance: Decimal
    payment_status: str
    payment_method: str
    issued_date: datetime
