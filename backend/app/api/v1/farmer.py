from typing import List, Optional
from datetime import datetime, date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.user import User
from app.models.produce import ProduceListing, ProduceImage, CropCategory
from app.models.offer import BuyerOffer, OfferNegotiation
from app.models.order import Order, WeighmentRecord
from app.models.payment import PaymentTransaction
from app.models.notification import Notification
from app.schemas.produce import (
    ProduceCreate,
    ProduceUpdate,
    ProduceFarmerResponse
)
from app.schemas.offer import OfferResponse, OfferCounter
from app.schemas.order import OrderResponse

router = APIRouter()

# ----------------- PRODUCE MANAGEMENT -----------------

@router.get("/produce", response_model=List[ProduceFarmerResponse])
def get_farmer_produce(
    status_filter: Optional[str] = None,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    query = db.query(ProduceListing).filter(ProduceListing.farmer_id == current_farmer.id)
    if status_filter:
        query = query.filter(ProduceListing.status == status_filter)
    listings = query.order_by(ProduceListing.created_at.desc()).all()
    
    # Enrich with count of pending offers
    for listing in listings:
        listing.active_offers_count = db.query(BuyerOffer).filter(
            BuyerOffer.produce_id == listing.id,
            BuyerOffer.status.in_(["pending", "countered"])
        ).count()
        
    return listings


@router.post("/produce", response_model=ProduceFarmerResponse, status_code=status.HTTP_201_CREATED)
def create_produce(
    data: ProduceCreate,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    # Validation
    if data.min_acceptable_price > data.asking_price_per_unit:
        raise HTTPException(
            status_code=400,
            detail="Minimum acceptable price cannot be higher than asking price"
        )
    if data.available_until < data.harvest_date:
        raise HTTPException(
            status_code=400,
            detail="Available until date must be after harvest date"
        )

    listing = ProduceListing(
        farmer_id=current_farmer.id,
        category_id=data.category_id,
        crop_name=data.crop_name,
        variety=data.variety,
        total_quantity=data.total_quantity,
        available_quantity=data.total_quantity,
        unit=data.unit,
        asking_price_per_unit=data.asking_price_per_unit,
        min_acceptable_price=data.min_acceptable_price,  # Stored securely for farmer only
        harvest_date=data.harvest_date,
        available_until=data.available_until,
        quality_grade=data.quality_grade,
        description=data.description,
        village=data.village,
        district=data.district,
        state=data.state,
        delivery_options=data.delivery_options,
        status="active"
    )
    db.add(listing)
    db.flush()

    # Add images
    if data.image_urls:
        for idx, url in enumerate(data.image_urls):
            img = ProduceImage(
                produce_id=listing.id,
                image_url=url,
                is_primary=(idx == 0)
            )
            db.add(img)

    db.commit()
    db.refresh(listing)
    deps.log_audit(db, current_farmer.id, "CREATE_PRODUCE", "ProduceListing", listing.id, f"Listed {listing.crop_name} ({listing.total_quantity} {listing.unit})")
    return listing


@router.put("/produce/{id}", response_model=ProduceFarmerResponse)
def update_produce(
    id: int,
    data: ProduceUpdate,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    listing = db.query(ProduceListing).filter(
        ProduceListing.id == id,
        ProduceListing.farmer_id == current_farmer.id
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found or unauthorized")

    update_dict = data.model_dump(exclude_unset=True)
    image_urls = update_dict.pop("image_urls", None)

    for field, val in update_dict.items():
        setattr(listing, field, val)

    if image_urls is not None:
        db.query(ProduceImage).filter(ProduceImage.produce_id == listing.id).delete()
        for idx, url in enumerate(image_urls):
            img = ProduceImage(
                produce_id=listing.id,
                image_url=url,
                is_primary=(idx == 0)
            )
            db.add(img)

    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)
    deps.log_audit(db, current_farmer.id, "UPDATE_PRODUCE", "ProduceListing", listing.id)
    return listing


@router.delete("/produce/{id}")
def delete_produce(
    id: int,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    listing = db.query(ProduceListing).filter(
        ProduceListing.id == id,
        ProduceListing.farmer_id == current_farmer.id
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found or unauthorized")

    # If orders exist, do not hard-delete, set status to expired/paused
    has_orders = db.query(Order).filter(Order.produce_id == listing.id).first()
    if has_orders:
        listing.status = "paused"
        db.commit()
        return {"message": "Listing has active/past orders and was paused instead of deleted"}

    db.delete(listing)
    db.commit()
    deps.log_audit(db, current_farmer.id, "DELETE_PRODUCE", "ProduceListing", id)
    return {"message": "Produce listing removed successfully"}


# ----------------- OFFERS & PRICE NEGOTIATION -----------------

@router.get("/offers", response_model=List[OfferResponse])
def get_farmer_offers(
    produce_id: Optional[int] = None,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    query = db.query(BuyerOffer).join(ProduceListing).filter(
        ProduceListing.farmer_id == current_farmer.id
    )
    if produce_id:
        query = query.filter(BuyerOffer.produce_id == produce_id)

    offers = query.order_by(BuyerOffer.created_at.desc()).all()
    return offers


@router.post("/offers/{id}/counter", response_model=OfferResponse)
def counter_offer(
    id: int,
    counter: OfferCounter,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    offer = db.query(BuyerOffer).join(ProduceListing).filter(
        BuyerOffer.id == id,
        ProduceListing.farmer_id == current_farmer.id
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status in ["accepted", "rejected", "converted_to_order"]:
        raise HTTPException(status_code=400, detail=f"Cannot counter offer with status {offer.status}")

    # Check against available quantity
    if counter.counter_quantity > offer.produce.available_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Counter quantity ({counter.counter_quantity}) exceeds available stock ({offer.produce.available_quantity} {offer.produce.unit})"
        )

    # Record negotiation step
    neg = OfferNegotiation(
        offer_id=offer.id,
        sender_id=current_farmer.id,
        counter_price_per_unit=counter.counter_price_per_unit,
        counter_quantity=counter.counter_quantity,
        message=counter.message,
        status="proposed"
    )
    db.add(neg)

    offer.status = "countered"
    offer.current_agreed_price = counter.counter_price_per_unit
    offer.current_agreed_quantity = counter.counter_quantity
    offer.updated_at = datetime.utcnow()

    # Notify Buyer
    notif = Notification(
        user_id=offer.buyer_id,
        type="counteroffer",
        title=f"Farmer Counter-Offer for {offer.produce.crop_name}",
        message=f"Farmer proposed ₹{counter.counter_price_per_unit}/{offer.produce.unit} for {counter.counter_quantity} {offer.produce.unit}. {counter.message or ''}",
        reference_type="offer",
        reference_id=offer.id
    )
    db.add(notif)
    db.commit()
    db.refresh(offer)

    deps.log_audit(db, current_farmer.id, "COUNTER_OFFER", "BuyerOffer", offer.id, f"Countered: ₹{counter.counter_price_per_unit} for {counter.counter_quantity}")
    return offer


@router.post("/offers/{id}/accept")
def accept_offer(
    id: int,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    # Retrieve offer and lock produce
    offer = db.query(BuyerOffer).join(ProduceListing).filter(
        BuyerOffer.id == id,
        ProduceListing.farmer_id == current_farmer.id
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status in ["accepted", "converted_to_order"]:
        raise HTTPException(status_code=400, detail="Offer is already accepted")

    produce = offer.produce
    final_qty = offer.current_agreed_quantity or offer.requested_quantity
    final_price = offer.current_agreed_price or offer.offered_price_per_unit

    # Check inventory strictly to prevent overselling
    if final_qty > produce.available_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept offer: Requested {final_qty} {produce.unit} exceeds remaining available stock of {produce.available_quantity} {produce.unit}"
        )

    # 1. Deduct stock atomically
    produce.available_quantity -= final_qty
    if produce.available_quantity <= 0:
        produce.available_quantity = 0
        produce.status = "sold_out"
    else:
        produce.status = "partially_sold"

    # 2. Update offer status
    offer.status = "converted_to_order"
    offer.current_agreed_price = final_price
    offer.current_agreed_quantity = final_qty

    # 3. Create confirmed Order
    order_number = f"RD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    initial_total = final_qty * final_price

    order = Order(
        order_number=order_number,
        offer_id=offer.id,
        produce_id=produce.id,
        farmer_id=current_farmer.id,
        buyer_id=offer.buyer_id,
        quantity=final_qty,
        agreed_price_per_unit=final_price,
        initial_total_amount=initial_total,
        final_payable_amount=initial_total,
        delivery_method=offer.delivery_method,
        delivery_address=offer.buyer.district + ", " + offer.buyer.state,
        estimated_delivery_date=offer.preferred_delivery_date,
        status="order_confirmed",
        payment_status="pending",
        status_notes="Order confirmed upon farmer accepting buyer offer"
    )
    db.add(order)

    # 4. Notify Buyer
    notif = Notification(
        user_id=offer.buyer_id,
        type="offer_accepted",
        title=f"Offer Accepted! Order #{order_number}",
        message=f"Farmer accepted your offer for {final_qty} {produce.unit} of {produce.crop_name} at ₹{final_price}/{produce.unit}.",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)

    db.commit()
    db.refresh(order)

    deps.log_audit(db, current_farmer.id, "ACCEPT_OFFER", "Order", order.id, f"Accepted offer #{offer.id}, created Order #{order_number}")
    return {
        "message": "Offer accepted successfully. Order created and stock updated.",
        "order_id": order.id,
        "order_number": order.order_number,
        "remaining_stock": produce.available_quantity
    }


@router.post("/offers/{id}/reject")
def reject_offer(
    id: int,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    offer = db.query(BuyerOffer).join(ProduceListing).filter(
        BuyerOffer.id == id,
        ProduceListing.farmer_id == current_farmer.id
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = "rejected"
    offer.updated_at = datetime.utcnow()

    # Notify buyer
    notif = Notification(
        user_id=offer.buyer_id,
        type="offer_rejected",
        title="Offer Declined",
        message=f"Farmer declined your offer for {offer.produce.crop_name}.",
        reference_type="offer",
        reference_id=offer.id
    )
    db.add(notif)
    db.commit()

    deps.log_audit(db, current_farmer.id, "REJECT_OFFER", "BuyerOffer", offer.id)
    return {"message": "Offer has been rejected"}


# ----------------- ORDERS & WEIGHMENT -----------------

@router.get("/orders", response_model=List[OrderResponse])
def get_farmer_orders(
    status_filter: Optional[str] = None,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Order).filter(Order.farmer_id == current_farmer.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).all()


@router.patch("/orders/{id}/status")
def update_farmer_order_status(
    id: int,
    status_val: str,
    notes: Optional[str] = None,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == id,
        Order.farmer_id == current_farmer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["order_confirmed", "preparing", "ready_for_pickup", "in_transit", "delivered"]
    if status_val not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status for farmer. Must be one of {valid_statuses}")

    order.status = status_val
    if notes:
        order.status_notes = notes
    order.updated_at = datetime.utcnow()

    # Notify buyer
    notif = Notification(
        user_id=order.buyer_id,
        type="order_status",
        title=f"Order #{order.order_number} Update",
        message=f"Your order status is now '{status_val.replace('_', ' ').title()}'. {notes or ''}",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)
    db.commit()

    deps.log_audit(db, current_farmer.id, "UPDATE_ORDER_STATUS", "Order", order.id, f"Status set to {status_val}")
    return {"message": f"Order status updated to {status_val}"}


@router.post("/orders/{id}/confirm-weighment")
def farmer_confirm_weighment(
    id: int,
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == id,
        Order.farmer_id == current_farmer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    weighment = db.query(WeighmentRecord).filter(WeighmentRecord.order_id == order.id).first()
    if not weighment:
        raise HTTPException(status_code=400, detail="No weighment record found to confirm")

    weighment.farmer_confirmed = True
    weighment.farmer_confirmed_at = datetime.utcnow()

    # If both confirmed, finalize verification
    if weighment.buyer_confirmed:
        weighment.verification_timestamp = datetime.utcnow()
        order.status = "verification_completed"
        order.final_payable_amount = weighment.calculated_final_amount

    db.commit()
    deps.log_audit(db, current_farmer.id, "CONFIRM_WEIGHMENT", "WeighmentRecord", weighment.id)
    return {
        "message": "Farmer weighment confirmation recorded",
        "both_confirmed": bool(weighment.buyer_confirmed and weighment.farmer_confirmed),
        "final_payable_amount": weighment.calculated_final_amount
    }


# ----------------- FARMER METRICS -----------------

@router.get("/metrics")
def get_farmer_metrics(
    current_farmer: User = Depends(deps.get_current_active_farmer),
    db: Session = Depends(deps.get_db)
):
    active_listings = db.query(ProduceListing).filter(
        ProduceListing.farmer_id == current_farmer.id,
        ProduceListing.status.in_(["active", "partially_sold"])
    ).count()

    available_qty = db.query(func.coalesce(func.sum(ProduceListing.available_quantity), 0.0)).filter(
        ProduceListing.farmer_id == current_farmer.id,
        ProduceListing.status.in_(["active", "partially_sold"])
    ).scalar()

    orders_received = db.query(Order).filter(Order.farmer_id == current_farmer.id).count()

    completed_sales = db.query(Order).filter(
        Order.farmer_id == current_farmer.id,
        Order.status.in_(["completed", "delivered", "verification_completed"])
    ).count()

    total_earnings = db.query(func.coalesce(func.sum(PaymentTransaction.amount), 0.0)).filter(
        PaymentTransaction.payee_id == current_farmer.id,
        PaymentTransaction.status == "completed"
    ).scalar()

    pending_payments = db.query(func.coalesce(func.sum(Order.final_payable_amount or Order.initial_total_amount), 0.0)).filter(
        Order.farmer_id == current_farmer.id,
        Order.payment_status.in_(["pending", "partially_paid"])
    ).scalar()

    return {
        "active_listings": active_listings,
        "available_quantity": round(available_qty, 2),
        "orders_received": orders_received,
        "pending_payments": round(pending_payments, 2),
        "completed_sales": completed_sales,
        "total_earnings": round(total_earnings, 2)
    }
