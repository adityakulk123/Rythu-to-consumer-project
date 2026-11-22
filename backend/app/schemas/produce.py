from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field

class ProduceImageSchema(BaseModel):
    id: Optional[int] = None
    image_url: str
    is_primary: bool = False
    caption: Optional[str] = None

    class Config:
        from_attributes = True

class CropCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class ProduceCreate(BaseModel):
    category_id: int
    crop_name: str = Field(..., min_length=2, max_length=150)
    variety: Optional[str] = None
    total_quantity: float = Field(..., gt=0)
    unit: str = "kg"  # 'kg', 'quintal', 'tonne'
    asking_price_per_unit: float = Field(..., gt=0)
    min_acceptable_price: float = Field(..., gt=0)  # PRIVATE: kept secret from buyers!
    harvest_date: date
    available_until: date
    quality_grade: str  # 'Grade A', 'Grade B', 'Grade C', 'Organic Premium'
    description: Optional[str] = None
    village: str
    district: str
    state: str
    delivery_options: str = "both"  # 'pickup_only', 'delivery_available', 'both'
    image_urls: Optional[List[str]] = []

class ProduceUpdate(BaseModel):
    category_id: Optional[int] = None
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    total_quantity: Optional[float] = None
    available_quantity: Optional[float] = None
    unit: Optional[str] = None
    asking_price_per_unit: Optional[float] = None
    min_acceptable_price: Optional[float] = None
    harvest_date: Optional[date] = None
    available_until: Optional[date] = None
    quality_grade: Optional[str] = None
    description: Optional[str] = None
    delivery_options: Optional[str] = None
    status: Optional[str] = None
    image_urls: Optional[List[str]] = None

class FarmerPublicInfo(BaseModel):
    id: int
    full_name: str
    village: str
    district: str
    state: str
    farm_name: Optional[str] = None
    organic_certified: Optional[bool] = False
    experience_years: Optional[int] = None

    class Config:
        from_attributes = True

# SAFE PUBLIC RESPONSE: min_acceptable_price is deliberately EXCLUDED!
class ProducePublicResponse(BaseModel):
    id: int
    farmer_id: int
    category_id: int
    crop_name: str
    variety: Optional[str] = None
    total_quantity: float
    available_quantity: float
    unit: str
    asking_price_per_unit: float
    harvest_date: date
    available_until: date
    quality_grade: str
    description: Optional[str] = None
    village: str
    district: str
    state: str
    delivery_options: str
    status: str
    created_at: datetime
    images: List[ProduceImageSchema] = []
    farmer: Optional[FarmerPublicInfo] = None
    category: Optional[CropCategoryResponse] = None

    class Config:
        from_attributes = True

# PRIVATE FARMER RESPONSE: for farmer's own dashboard, includes min_acceptable_price
class ProduceFarmerResponse(BaseModel):
    id: int
    farmer_id: int
    category_id: int
    crop_name: str
    variety: Optional[str] = None
    total_quantity: float
    available_quantity: float
    unit: str
    asking_price_per_unit: float
    min_acceptable_price: float  # Only the farmer who created it can see this
    harvest_date: date
    available_until: date
    quality_grade: str
    description: Optional[str] = None
    village: str
    district: str
    state: str
    delivery_options: str
    status: str
    created_at: datetime
    images: List[ProduceImageSchema] = []
    category: Optional[CropCategoryResponse] = None
    active_offers_count: Optional[int] = 0

    class Config:
        from_attributes = True
