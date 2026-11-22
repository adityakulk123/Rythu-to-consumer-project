from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.market import MarketPriceResponse, MarketPriceCreate
from app.services.market_service import get_market_prices, compare_crop_markets, add_market_price

router = APIRouter()

@router.get("", response_model=List[MarketPriceResponse])
def search_market_prices(
    crop_name: Optional[str] = Query(None, description="Crop name to search"),
    market_name: Optional[str] = Query(None, description="Market / Mandi name"),
    district: Optional[str] = Query(None, description="District filter"),
    db: Session = Depends(get_db)
):
    """
    Get live/sample Mandi benchmark prices with explicit observation dates and source labels.
    """
    return get_market_prices(db, crop_name, market_name, district)

@router.get("/compare")
def compare_markets(
    crop_name: str = Query(..., description="Crop name to compare across mandis"),
    db: Session = Depends(get_db)
):
    """
    Compare prices of a crop across multiple regional Mandis to discover the highest modal price.
    """
    return compare_crop_markets(db, crop_name)
