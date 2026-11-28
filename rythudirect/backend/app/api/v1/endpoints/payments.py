from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_buyer
from app.models.user import User
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.schemas.payment import PaymentProcessRequest, PaymentTransactionResponse, ReceiptResponse
from app.services.payment_service import process_payment, get_receipt, _format_payment_response

router = APIRouter()

@router.post("/process", response_model=PaymentTransactionResponse)
def execute_payment(data: PaymentProcessRequest, current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """
    Process advance or balance payment through verified escrow/gateway integration.
    Never marks payment complete without provider confirmation.
    """
    return process_payment(db, current_buyer, data)

@router.get("/{order_id}", response_model=Optional[PaymentTransactionResponse])
def get_payment_details(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get payment tracking details for an order with strict authorization check."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    if current_user.role != "ADMIN" and current_user.id != order.farmer_id and current_user.id != order.buyer_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view payment details for this order.")
    payment = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
    if not payment:
        return None
    return _format_payment_response(payment)

@router.get("/{order_id}/receipt", response_model=ReceiptResponse)
def get_order_receipt(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate official transaction receipt."""
    return get_receipt(db, order_id, current_user)
