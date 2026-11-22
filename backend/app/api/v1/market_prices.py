from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api import deps
from app.models.market_price import MarketPrice
from app.schemas.market_price import MarketPriceResponse

router = APIRouter()

@router.get("/", response_model=List[MarketPriceResponse])
def get_market_prices(
    crop_name: Optional[str] = None,
    district: Optional[str] = None,
    market_name: Optional[str] = None,
    db: Session = Depends(deps.get_db)
):
    query = db.query(MarketPrice)

    if crop_name:
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))

    if district:
        query = query.filter(MarketPrice.district.ilike(f"%{district}%"))

    if market_name:
        query = query.filter(MarketPrice.market_name.ilike(f"%{market_name}%"))

    return query.order_by(MarketPrice.observation_date.desc(), MarketPrice.crop_name.asc()).all()


@router.get("/compare")
def compare_crop_across_markets(
    crop_name: str,
    db: Session = Depends(deps.get_db)
):
    records = db.query(MarketPrice).filter(
        MarketPrice.crop_name.ilike(f"%{crop_name}%")
    ).order_by(MarketPrice.modal_price.desc()).all()

    if not records:
        return {"crop_name": crop_name, "markets": [], "summary": {}}

    modal_prices = [r.modal_price for r in records]
    avg_price = sum(modal_prices) / len(modal_prices) if modal_prices else 0
    highest = max(modal_prices) if modal_prices else 0
    lowest = min(modal_prices) if modal_prices else 0

    return {
        "crop_name": crop_name,
        "summary": {
            "average_modal_price": round(avg_price, 2),
            "highest_price": highest,
            "lowest_price": lowest,
            "spread": round(highest - lowest, 2)
        },
        "markets": [MarketPriceResponse.model_validate(r) for r in records]
    }
