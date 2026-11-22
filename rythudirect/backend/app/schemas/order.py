from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

class OrderItemResponse(BaseModel):
    id: int
    crop_name: str
    quantity: Decimal
    price_per_kg: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_number: str
    produce_id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    farmer_village: Optional[str] = None
    farmer_mobile: Optional[str] = None
    buyer_id: int
    buyer_name: Optional[str] = None
    buyer_business_name: Optional[str] = None
    buyer_mobile: Optional[str] = None
    crop_name: Optional[str] = None
    agreed_quantity: Decimal
    agreed_price_per_kg: Decimal
    total_estimated_amount: Decimal
    status: str # CONFIRMED, WEIGHMENT_PENDING, WEIGHMENT_COMPLETED, DELIVERED, COMPLETED, CANCELLED, DISPUTED
    delivery_method: str
    delivery_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    has_weighment: bool = False
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True

class OrderConfirmRequest(BaseModel):
    delivery_address: Optional[str] = None
