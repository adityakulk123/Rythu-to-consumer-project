from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_farmer
from app.models.user import User
from app.models.produce import ProduceListing
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.schemas.produce import ProduceCreate, ProduceUpdate, ProduceResponse, ProduceListFilter
from app.schemas.offer import OfferResponse, OfferCounterCreate
from app.schemas.order import OrderResponse
from app.services.produce_service import create_produce_listing, list_produce, update_produce_listing, delete_produce_listing
from app.services.negotiation_service import get_offers_for_farmer, accept_offer, counter_offer, reject_offer
from app.services.order_service import get_orders_for_user

router = APIRouter()

@router.get("/dashboard")
def get_farmer_dashboard(current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """
    Farmer Dashboard Overview Cards:
    - Total active listings
    - Total quantity available
    - Total orders received
    - Pending payments
    - Completed sales
    - Total earnings
    """
    # Active listings & total quantity available
    active_listings = db.query(ProduceListing).filter(
        ProduceListing.farmer_id == current_farmer.id,
        ProduceListing.status.in_(["ACTIVE", "PARTIALLY_SOLD"])
    ).all()
    
    total_active_listings = len(active_listings)
    total_quantity_available = sum([l.remaining_quantity for l in active_listings], Decimal("0.0"))

    # Orders received
    orders = db.query(Order).filter(Order.farmer_id == current_farmer.id).all()
    total_orders_received = len(orders)

    # Payments
    payments = db.query(PaymentTransaction).join(PaymentTransaction.order).filter(
        Order.farmer_id == current_farmer.id
    ).all()

    pending_payments_count = sum(1 for p in payments if p.payment_status in ["PAYMENT_PENDING", "ADVANCE_PAID", "PARTIALLY_PAID"])
    pending_payments_amount = sum([p.outstanding_balance for p in payments if p.payment_status in ["PAYMENT_PENDING", "ADVANCE_PAID", "PARTIALLY_PAID"]], Decimal("0.0"))
    
    completed_sales = sum(1 for p in payments if p.payment_status == "FULLY_PAID")
    total_earnings = sum([p.amount for p in payments if p.payment_status == "FULLY_PAID"], Decimal("0.0")) + \
                     sum([p.advance_amount for p in payments if p.payment_status in ["ADVANCE_PAID", "PARTIALLY_PAID"]], Decimal("0.0"))

    # Pending offers count
    pending_offers_count = db.query(func.count()).select_from(ProduceListing).join(ProduceListing.offers).filter(
        ProduceListing.farmer_id == current_farmer.id,
        ProduceListing.offers.any(status="PENDING")
    ).scalar() or 0

    return {
        "farmer_name": current_farmer.full_name,
        "village": current_farmer.village,
        "district": current_farmer.district,
        "total_active_listings": total_active_listings,
        "total_quantity_available_kg": float(total_quantity_available),
        "total_orders_received": total_orders_received,
        "pending_payments_count": pending_payments_count,
        "pending_payments_amount": float(pending_payments_amount),
        "completed_sales": completed_sales,
        "total_earnings": float(total_earnings),
        "pending_offers_count": pending_offers_count
    }

@router.post("/produce", response_model=ProduceResponse, status_code=status.HTTP_201_CREATED)
def add_produce(data: ProduceCreate, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Add new produce listing with asking price and strictly private minimum price."""
    return create_produce_listing(db, current_farmer, data)

@router.get("/produce")
def get_farmer_produce(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_farmer: User = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """List all produce listings created by this farmer."""
    filter_params = ProduceListFilter(page=page, page_size=page_size)
    return list_produce(db, filter_params, current_user=current_farmer, farmer_id=current_farmer.id)

@router.put("/produce/{id}", response_model=ProduceResponse)
def update_produce(id: int, data: ProduceUpdate, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Update or pause a produce listing."""
    return update_produce_listing(db, id, current_farmer, data)

@router.delete("/produce/{id}")
def delete_produce(id: int, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Remove a produce listing."""
    return delete_produce_listing(db, id, current_farmer)

@router.get("/offers", response_model=List[OfferResponse])
def get_offers(produce_id: Optional[int] = None, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """View and compare buyer offers for farmer's produce listings."""
    return get_offers_for_farmer(db, current_farmer, produce_id)

@router.post("/offers/{id}/accept")
def accept_buyer_offer(id: int, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """
    Accept a buyer offer.
    Executes atomic stock deduction, locks remaining quantity, and generates a confirmed Order.
    """
    return accept_offer(db, current_farmer, id)

@router.post("/offers/{id}/counter", response_model=OfferResponse)
def counter_buyer_offer(id: int, data: OfferCounterCreate, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Counter a buyer offer with new price or quantity."""
    return counter_offer(db, current_farmer, id, data)

@router.post("/offers/{id}/reject", response_model=OfferResponse)
def reject_buyer_offer(id: int, reason: Optional[str] = None, current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Reject a buyer offer."""
    return reject_offer(db, current_farmer, id, reason)

@router.get("/orders", response_model=List[OrderResponse])
def get_farmer_orders(current_farmer: User = Depends(get_current_farmer), db: Session = Depends(get_db)):
    """Manage farmer orders."""
    return get_orders_for_user(db, current_farmer)
