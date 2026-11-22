from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.order import OrderResponse
from app.schemas.weighment import WeighmentCreate, WeighmentConfirm, WeighmentResponse
from app.services.order_service import get_order_by_id, update_order_delivery_status
from app.services.weighment_service import record_weighment, confirm_weighment, get_weighment_by_order

router = APIRouter()

@router.get("/{id}", response_model=OrderResponse)
def get_order(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full details of an order."""
    return get_order_by_id(db, id, current_user)

@router.post("/{id}/weighment", response_model=WeighmentResponse)
def log_weighment(id: int, data: WeighmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Log certified scale weighment and container tare deductions.
    Calculates: Net Weight = Gross Weight - Packaging Weight
    Final Amount = Accepted Net Quantity * Agreed Price
    """
    return record_weighment(db, id, current_user, data)

@router.get("/{id}/weighment", response_model=Optional[WeighmentResponse])
def get_order_weighment(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get weighment record for this order."""
    return get_weighment_by_order(db, id, current_user)

@router.post("/{id}/weighment/confirm", response_model=WeighmentResponse)
def confirm_order_weighment(id: int, confirm_data: WeighmentConfirm, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Confirm weighment. When both farmer and buyer confirm, the record is locked,
    order status advances to WEIGHMENT_COMPLETED, and payment amount is synchronized.
    """
    return confirm_weighment(db, id, current_user, confirm_data)

@router.post("/{id}/delivery-confirmation", response_model=OrderResponse)
def confirm_order_delivery(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Confirm produce delivery receipt."""
    return update_order_delivery_status(db, id, current_user, "DELIVERED")
