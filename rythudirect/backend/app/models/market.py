import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date
from app.core.database import Base

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(150), nullable=False, index=True)
    market_name = Column(String(150), nullable=False, index=True)  # e.g., Bowenpally Mandi, Warangal APMC
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, default="Telangana")
    
    min_price = Column(Numeric(10, 2), nullable=False)   # per kg
    max_price = Column(Numeric(10, 2), nullable=False)   # per kg
    modal_price = Column(Numeric(10, 2), nullable=False) # per kg (most common trading price)
    
    observation_date = Column(Date, nullable=False, index=True)
    data_source = Column(String(255), nullable=False, default="Agmarknet / Directorate of Marketing & Inspection (DMI)")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
