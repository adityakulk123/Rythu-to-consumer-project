import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    
    amount = Column(Numeric(14, 2), nullable=False)              # Total order amount
    advance_amount = Column(Numeric(14, 2), default=0.0)         # Advance paid
    outstanding_balance = Column(Numeric(14, 2), nullable=False) # amount - advance_amount
    
    # PAYMENT_PENDING, ADVANCE_PAID, PARTIALLY_PAID, FULLY_PAID, PAYMENT_OVERDUE, DISPUTED, REFUNDED
    payment_status = Column(String(40), default="PAYMENT_PENDING", index=True)
    payment_method = Column(String(50), default="ESCROW_MOCK")   # BANK_TRANSFER, UPI, CASH_ON_DELIVERY, ESCROW_MOCK
    
    due_date = Column(Date, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    receipt_number = Column(String(100), nullable=True)
    gateway_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="payment_transaction")
