from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

class MarketPriceResponse(BaseModel):
    id: int
    crop_name: str
    variety: str
    market_name: str
    district: str
    state: str
    min_price: float
    max_price: float
    modal_price: float
    unit: str
    observation_date: date
    source: str
    is_sample_data: bool
    data_label: str

    class Config:
        from_attributes = True
