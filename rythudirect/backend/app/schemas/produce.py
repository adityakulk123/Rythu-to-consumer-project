from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field

class CropCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True

class CropCategoryCreate(CropCategoryBase):
    pass

class CropCategoryResponse(CropCategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProduceImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class ProduceBase(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=150)
    category_id: int
    quantity: Decimal = Field(..., gt=0)
    unit: str = "KG"
    expected_price_per_kg: Decimal = Field(..., gt=0)
    min_acceptable_price: Decimal = Field(..., gt=0) # STRICTLY PRIVATE
    harvest_date: date
    available_until: date
    quality_grade: str = "Grade A"
    description: Optional[str] = None
    village: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_available: bool = False
    pickup_available: bool = True
    image_urls: List[str] = []

class ProduceCreate(ProduceBase):
    pass

class ProduceUpdate(BaseModel):
    crop_name: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    expected_price_per_kg: Optional[Decimal] = None
    min_acceptable_price: Optional[Decimal] = None
    harvest_date: Optional[date] = None
    available_until: Optional[date] = None
    quality_grade: Optional[str] = None
    description: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_available: Optional[bool] = None
    pickup_available: Optional[bool] = None
    status: Optional[str] = None # ACTIVE, PAUSED, SOLD_OUT
    image_urls: Optional[List[str]] = None

class FarmerBasicInfo(BaseModel):
    id: int
    full_name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farm_name: Optional[str] = None

class ProduceResponse(BaseModel):
    id: int
    farmer_id: int
    category_id: int
    crop_name: str
    quantity: Decimal
    unit: str
    remaining_quantity: Decimal
    expected_price_per_kg: Decimal
    min_acceptable_price: Optional[Decimal] = None # Masked for non-owners/buyers
    harvest_date: date
    available_until: date
    quality_grade: str
    description: Optional[str] = None
    village: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_available: bool
    pickup_available: bool
    status: str
    created_at: datetime
    images: List[ProduceImageResponse] = []
    farmer: Optional[FarmerBasicInfo] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class ProduceListFilter(BaseModel):
    crop_name: Optional[str] = None
    category_id: Optional[int] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    quality_grade: Optional[str] = None
    sort_by: Optional[str] = "recently_listed" # lowest_price, highest_price, recently_listed, highest_quantity
    page: int = 1
    page_size: int = 12
