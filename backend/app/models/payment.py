from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_stage = Column(String(30), default="full")  # 'advance', 'final_balance', 'full'
    payment_method = Column(String(50), default="upi")  # 'upi', 'bank_transfer', 'escrow_wallet', 'cash_on_delivery'
    
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    receipt_number = Column(String(50), unique=True, nullable=False)
    
    is_demo = Column(Boolean, default=True)  # Clearly labels simulated transactions
    demo_badge_text = Column(String(50), default="DEMO SIMULATED TRANSACTION")
    
    gateway_order_id = Column(String(100), nullable=True)
    gateway_payment_id = Column(String(100), nullable=True)
    
    status = Column(String(30), default="completed")  # 'initiated', 'completed', 'failed', 'refunded'
    notes = Column(Text, nullable=True)
    confirmed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment_transactions")
    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
