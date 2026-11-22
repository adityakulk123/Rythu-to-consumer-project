from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_buyer, get_optional_user
from app.models.user import User
from app.models.produce import ProduceListing
from app.models.offer import BuyerOffer
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.schemas.produce import ProduceResponse, ProduceListFilter
from app.schemas.offer import OfferCreate, OfferCounterCreate, OfferResponse
from app.schemas.order import OrderResponse
from app.services.produce_service import list_produce, get_produce_listing
from app.services.negotiation_service import create_offer, get_offers_for_buyer, counter_offer, reject_offer
from app.services.order_service import get_orders_for_user

router = APIRouter()

@router.get("/dashboard")
def get_buyer_dashboard(current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """
    Buyer Dashboard Overview:
    - Available produce count
    - Active quotations
    - Pending orders
    - Completed orders
    - Total purchases
    """
    available_produce_count = db.query(func.count(ProduceListing.id)).filter(
        ProduceListing.status.in_(["ACTIVE", "PARTIALLY_SOLD"])
    ).scalar() or 0

    active_quotations = db.query(func.count(BuyerOffer.id)).filter(
        BuyerOffer.buyer_id == current_buyer.id,
        BuyerOffer.status.in_(["PENDING", "COUNTERED"])
    ).scalar() or 0

    orders = db.query(Order).filter(Order.buyer_id == current_buyer.id).all()
    pending_orders = sum(1 for o in orders if o.status not in ["COMPLETED", "CANCELLED"])
    completed_orders = sum(1 for o in orders if o.status == "COMPLETED")

    payments = db.query(PaymentTransaction).join(PaymentTransaction.order).filter(
        Order.buyer_id == current_buyer.id,
        PaymentTransaction.payment_status.in_(["FULLY_PAID", "ADVANCE_PAID", "PARTIALLY_PAID"])
    ).all()
    
    total_purchases = sum([
        p.amount if p.payment_status == "FULLY_PAID" else p.advance_amount
        for p in payments
    ], Decimal("0.0"))

    is_verified = False
    if current_buyer.buyer_profile:
        is_verified = current_buyer.buyer_profile.is_verified

    return {
        "buyer_name": current_buyer.full_name,
        "business_name": current_buyer.buyer_profile.business_name if current_buyer.buyer_profile else None,
        "is_verified": is_verified,
        "available_produce_count": available_produce_count,
        "active_quotations": active_quotations,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_purchases": float(total_purchases)
    }

@router.get("/produce")
def browse_produce(
    crop_name: Optional[str] = None,
    category_id: Optional[int] = None,
    village: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    quality_grade: Optional[str] = None,
    sort_by: Optional[str] = "recently_listed",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Browse produce with intelligent search, filter, and sorting.
    (Private minimum acceptable price is strictly stripped/masked!)
    """
    filter_params = ProduceListFilter(
        crop_name=crop_name,
        category_id=category_id,
        village=village,
        district=district,
        state=state,
        min_price=min_price,
        max_price=max_price,
        quality_grade=quality_grade,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )
    return list_produce(db, filter_params, current_user=current_user)

@router.get("/produce/{id}", response_model=ProduceResponse)
def get_produce_detail(id: int, current_user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """View detailed produce page."""
    return get_produce_listing(db, id, current_user=current_user)

@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def submit_purchase_offer(data: OfferCreate, current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """Submit a purchase offer/quotation to the farmer."""
    return create_offer(db, current_buyer, data)

@router.get("/offers", response_model=List[OfferResponse])
def get_buyer_quotations(current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """View all offers submitted by this buyer."""
    return get_offers_for_buyer(db, current_buyer)

@router.post("/offers/{id}/counter", response_model=OfferResponse)
def counter_offer_by_buyer(id: int, data: OfferCounterCreate, current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """Counter a farmer's price or condition."""
    return counter_offer(db, current_buyer, id, data)

@router.post("/offers/{id}/cancel", response_model=OfferResponse)
def cancel_buyer_offer(id: int, current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """Cancel a pending offer."""
    return reject_offer(db, current_buyer, id, reason="Cancelled by buyer")

@router.get("/orders", response_model=List[OrderResponse])
def get_buyer_orders(current_buyer: User = Depends(get_current_buyer), db: Session = Depends(get_db)):
    """Manage buyer purchase orders."""
    return get_orders_for_user(db, current_buyer)
