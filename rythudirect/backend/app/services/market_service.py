from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.market import MarketPrice
from app.schemas.market import MarketPriceResponse, MarketPriceCreate

def get_market_prices(
    db: Session,
    crop_name: Optional[str] = None,
    market_name: Optional[str] = None,
    district: Optional[str] = None
) -> List[MarketPriceResponse]:
    query = db.query(MarketPrice)
    if crop_name:
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name.strip()}%"))
    if market_name:
        query = query.filter(MarketPrice.market_name.ilike(f"%{market_name.strip()}%"))
    if district:
        query = query.filter(MarketPrice.district.ilike(f"%{district.strip()}%"))

    prices = query.order_by(desc(MarketPrice.observation_date), MarketPrice.crop_name).all()
    return [MarketPriceResponse.model_validate(p) for p in prices]

def compare_crop_markets(db: Session, crop_name: str) -> dict:
    prices = db.query(MarketPrice).filter(
        MarketPrice.crop_name.ilike(f"%{crop_name.strip()}%")
    ).order_by(desc(MarketPrice.observation_date)).all()

    result = {
        "crop_name": crop_name,
        "markets_count": len(prices),
        "data_source_disclaimer": "Authorized Feed: Agmarknet / Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Govt of India (Sample Verified Feed)",
        "markets": [MarketPriceResponse.model_validate(p) for p in prices]
    }
    return result

def add_market_price(db: Session, data: MarketPriceCreate) -> MarketPriceResponse:
    price = MarketPrice(
        crop_name=data.crop_name.strip(),
        market_name=data.market_name.strip(),
        district=data.district.strip(),
        state=data.state.strip(),
        min_price=data.min_price,
        max_price=data.max_price,
        modal_price=data.modal_price,
        observation_date=data.observation_date,
        data_source=data.data_source
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    return MarketPriceResponse.model_validate(price)
