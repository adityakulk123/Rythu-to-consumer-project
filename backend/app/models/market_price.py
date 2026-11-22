from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float
from app.database.session import Base

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), default="Common / Hybrid")
    market_name = Column(String(150), nullable=False, index=True)  # Mandi Name (e.g. Bowenpally, Guntur, Madanapalle)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), default="Andhra Pradesh / Telangana")
    
    min_price = Column(Float, nullable=False)   # ₹ per quintal or kg
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False) # Most common trading price
    unit = Column(String(20), default="quintal") # 'quintal' (100 kg) or 'kg'
    
    observation_date = Column(Date, nullable=False, index=True)
    source = Column(String(150), default="APMC Market Yard Daily Bulletin")
    is_sample_data = Column(Boolean, default=True)  # Strictly distinguished
    data_label = Column(String(50), default="OFFICIAL APMC MANDI RECORD (DAILY)")
    
    created_at = Column(DateTime, default=datetime.utcnow)
