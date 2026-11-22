from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

class MarketPriceBase(BaseModel):
    crop_name: str
    market_name: str
    district: str
    state: str = "Telangana"
    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal
    observation_date: date
    data_source: str = "Agmarknet / DMI Govt of India"

class MarketPriceCreate(MarketPriceBase):
    pass

class MarketPriceResponse(MarketPriceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
