import uuid
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.offer import BuyerOffer, OfferNegotiation
from app.models.produce import ProduceListing
from app.models.order import Order, OrderItem
from app.models.payment import PaymentTransaction
from app.models.user import User, UserRole
from app.schemas.offer import OfferCreate, OfferCounterCreate, OfferResponse, NegotiationResponse, BuyerBasicInfo
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

def _format_offer_response(offer: BuyerOffer) -> OfferResponse:
    buyer_info = None
    if offer.buyer:
        b_prof = offer.buyer.buyer_profile
        buyer_info = BuyerBasicInfo(
            id=offer.buyer.id,
            full_name=offer.buyer.full_name,
            business_name=b_prof.business_name if b_prof else None,
            business_type=b_prof.business_type if b_prof else None,
            is_verified=b_prof.is_verified if b_prof else False,
            rating=b_prof.rating if b_prof else Decimal("4.80"),
            district=offer.buyer.district
        )

    negotiations = [
        NegotiationResponse(
            id=neg.id,
            offer_id=neg.offer_id,
            sender_id=neg.sender_id,
            sender_name=neg.sender.full_name if neg.sender else None,
            sender_role=neg.sender.role if neg.sender else None,
            counter_price_per_kg=neg.counter_price_per_kg,
            counter_quantity=neg.counter_quantity,
            notes=neg.notes,
            created_at=neg.created_at
        ) for neg in offer.negotiations
    ]

    return OfferResponse(
        id=offer.id,
        produce_id=offer.produce_id,
        crop_name=offer.produce.crop_name if offer.produce else None,
        buyer_id=offer.buyer_id,
        quantity=offer.quantity,
        offered_price_per_kg=offer.offered_price_per_kg,
        preferred_delivery_date=offer.preferred_delivery_date,
        delivery_method=offer.delivery_method,
        additional_requirements=offer.additional_requirements,
        status=offer.status,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
        buyer=buyer_info,
        negotiations=negotiations,
        farmer_id=offer.produce.farmer_id if offer.produce else None,
        farmer_name=offer.produce.farmer.full_name if offer.produce and offer.produce.farmer else None,
        produce_remaining_quantity=offer.produce.remaining_quantity if offer.produce else None,
        produce_expected_price=offer.produce.expected_price_per_kg if offer.produce else None
    )

def create_offer(db: Session, buyer: User, data: OfferCreate) -> OfferResponse:
    if buyer.role != UserRole.BUYER and buyer.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered buyers can submit purchase offers."
        )

    produce = db.query(ProduceListing).filter(ProduceListing.id == data.produce_id).first()
    if not produce:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produce listing not found.")

    if produce.status not in ["ACTIVE", "PARTIALLY_SOLD"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This produce is no longer accepting offers (Status: {produce.status})."
        )

    if data.quantity > produce.remaining_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({data.quantity} kg) exceeds remaining available stock ({produce.remaining_quantity} kg)."
        )

    offer = BuyerOffer(
        produce_id=data.produce_id,
        buyer_id=buyer.id,
        quantity=data.quantity,
        offered_price_per_kg=data.offered_price_per_kg,
        preferred_delivery_date=data.preferred_delivery_date,
        delivery_method=data.delivery_method,
        additional_requirements=data.additional_requirements,
        status="PENDING"
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    # Initial negotiation entry
    neg = OfferNegotiation(
        offer_id=offer.id,
        sender_id=buyer.id,
        counter_price_per_kg=data.offered_price_per_kg,
        counter_quantity=data.quantity,
        notes=f"Initial purchase offer submitted: {data.quantity} kg @ ₹{data.offered_price_per_kg}/kg"
    )
    db.add(neg)
    db.commit()

    # Notify Farmer
    create_notification(
        db=db,
        user_id=produce.farmer_id,
        title="New Buyer Offer Received!",
        message=f"{buyer.full_name} submitted an offer of ₹{data.offered_price_per_kg}/kg for {data.quantity} kg of {produce.crop_name}.",
        notification_type="OFFER",
        link=f"/farmer/offers"
    )

    log_action(
        db=db,
        action="CREATE_OFFER",
        entity_type="BuyerOffer",
        entity_id=offer.id,
        user_id=buyer.id,
        new_values={"produce_id": produce.id, "quantity": str(data.quantity), "price": str(data.offered_price_per_kg)}
    )

    return _format_offer_response(offer)

def counter_offer(db: Session, user: User, offer_id: int, data: OfferCounterCreate) -> OfferResponse:
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    produce = offer.produce
    is_farmer = (produce.farmer_id == user.id)
    is_buyer = (offer.buyer_id == user.id)

    if not is_farmer and not is_buyer and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to counter this offer.")

    if offer.status in ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot counter an offer with status: {offer.status}"
        )

    counter_qty = data.counter_quantity or offer.quantity
    if counter_qty > produce.remaining_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Counter quantity ({counter_qty} kg) exceeds remaining available stock ({produce.remaining_quantity} kg)."
        )

    # Record negotiation log
    neg = OfferNegotiation(
        offer_id=offer.id,
        sender_id=user.id,
        counter_price_per_kg=data.counter_price_per_kg,
        counter_quantity=counter_qty,
        notes=data.notes
    )
    db.add(neg)

    # Update active offer price & quantity
    offer.offered_price_per_kg = data.counter_price_per_kg
    offer.quantity = counter_qty
    offer.status = "COUNTERED"
    offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(offer)

    # Notify counterparty
    recipient_id = offer.buyer_id if is_farmer else produce.farmer_id
    role_label = "Farmer" if is_farmer else "Buyer"
    create_notification(
        db=db,
        user_id=recipient_id,
        title=f"Counteroffer from {role_label}",
        message=f"{user.full_name} countered with ₹{data.counter_price_per_kg}/kg for {counter_qty} kg of {produce.crop_name}.",
        notification_type="COUNTER",
        link="/buyer/offers" if is_farmer else "/farmer/offers"
    )

    log_action(
        db=db,
        action="COUNTER_OFFER",
        entity_type="BuyerOffer",
        entity_id=offer.id,
        user_id=user.id,
        new_values={"counter_price": str(data.counter_price_per_kg), "counter_qty": str(counter_qty)}
    )

    return _format_offer_response(offer)

def accept_offer(db: Session, farmer: User, offer_id: int) -> dict:
    """
    ATOMIC INVENTORY ALLOCATION & ORDER CONFIRMATION
    - Locks produce row
    - Verifies produce.remaining_quantity >= offer.quantity
    - Deducts quantity atomically
    - Changes status to PARTIALLY_SOLD or SOLD_OUT
    - Creates confirmed Order & OrderItem
    - Sets initial PaymentTransaction (PAYMENT_PENDING)
    - Auto-expires conflicting pending offers
    - Sends notifications
    """
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    produce = offer.produce
    if produce.farmer_id != farmer.id and farmer.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the listing owner farmer can accept this offer.")

    if offer.status == "ACCEPTED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This offer has already been accepted.")

    if offer.status in ["REJECTED", "EXPIRED", "CANCELLED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot accept offer with status '{offer.status}'.")

    # Transactional check against over-selling
    if produce.remaining_quantity < offer.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept offer: Available stock ({produce.remaining_quantity} kg) is less than requested offer quantity ({offer.quantity} kg)."
        )

    # 1. Deduct quantity atomically
    produce.remaining_quantity = produce.remaining_quantity - offer.quantity
    if produce.remaining_quantity == Decimal("0"):
        produce.status = "SOLD_OUT"
    else:
        produce.status = "PARTIALLY_SOLD"
    produce.updated_at = datetime.utcnow()

    # 2. Mark offer accepted
    offer.status = "ACCEPTED"
    offer.updated_at = datetime.utcnow()

    # 3. Create confirmed Order
    order_num = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    total_amount = offer.quantity * offer.offered_price_per_kg
    
    order = Order(
        order_number=order_num,
        produce_id=produce.id,
        farmer_id=produce.farmer_id,
        buyer_id=offer.buyer_id,
        offer_id=offer.id,
        agreed_quantity=offer.quantity,
        agreed_price_per_kg=offer.offered_price_per_kg,
        total_estimated_amount=total_amount,
        status="CONFIRMED",
        delivery_method=offer.delivery_method,
        delivery_address=produce.delivery_location
    )
    db.add(order)
    db.flush() # Flush to get order.id

    # 4. Create Order Item
    order_item = OrderItem(
        order_id=order.id,
        crop_name=produce.crop_name,
        quantity=offer.quantity,
        price_per_kg=offer.offered_price_per_kg,
        total_price=total_amount
    )
    db.add(order_item)

    # 5. Initialize Payment Transaction
    payment_txn = PaymentTransaction(
        order_id=order.id,
        transaction_reference=f"TXN-INIT-{uuid.uuid4().hex[:8].upper()}",
        amount=total_amount,
        advance_amount=Decimal("0.0"),
        outstanding_balance=total_amount,
        payment_status="PAYMENT_PENDING",
        payment_method="ESCROW_MOCK",
        receipt_number=f"REC-PENDING-{uuid.uuid4().hex[:6].upper()}"
    )
    db.add(payment_txn)

    # 6. Auto-expire other pending offers that now exceed the remaining stock
    conflicting_offers = db.query(BuyerOffer).filter(
        BuyerOffer.produce_id == produce.id,
        BuyerOffer.id != offer.id,
        BuyerOffer.status.in_(["PENDING", "COUNTERED"]),
        BuyerOffer.quantity > produce.remaining_quantity
    ).all()

    for conf in conflicting_offers:
        conf.status = "EXPIRED"
        create_notification(
            db=db,
            user_id=conf.buyer_id,
            title="Offer Expired (Stock Partially Fulfilled)",
            message=f"Your offer for {produce.crop_name} expired because another buyer completed a purchase and available stock is now {produce.remaining_quantity} kg.",
            notification_type="OFFER",
            link="/buyer/offers"
        )

    db.commit()
    db.refresh(order)
    db.refresh(produce)

    # 7. Send Notifications
    create_notification(
        db=db,
        user_id=offer.buyer_id,
        title="Offer Accepted! Order Created 🎉",
        message=f"Farmer {farmer.full_name} accepted your offer for {offer.quantity} kg of {produce.crop_name} @ ₹{offer.offered_price_per_kg}/kg. Order #{order.order_number} is confirmed.",
        notification_type="ORDER",
        link=f"/buyer/orders"
    )

    create_notification(
        db=db,
        user_id=farmer.id,
        title=f"Order #{order.order_number} Confirmed",
        message=f"You accepted offer from {offer.buyer.full_name}. Remaining stock of {produce.crop_name}: {produce.remaining_quantity} kg.",
        notification_type="ORDER",
        link=f"/farmer/orders"
    )

    log_action(
        db=db,
        action="ACCEPT_OFFER",
        entity_type="Order",
        entity_id=order.id,
        user_id=farmer.id,
        new_values={"order_number": order.order_number, "quantity": str(offer.quantity), "amount": str(total_amount)}
    )

    return {
        "message": "Offer accepted successfully and order created.",
        "order_id": order.id,
        "order_number": order.order_number,
        "remaining_quantity": produce.remaining_quantity,
        "produce_status": produce.status
    }

def reject_offer(db: Session, user: User, offer_id: int, reason: Optional[str] = None) -> OfferResponse:
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    produce = offer.produce
    is_farmer = (produce.farmer_id == user.id)
    is_buyer = (offer.buyer_id == user.id)

    if not is_farmer and not is_buyer and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reject this offer.")

    offer.status = "REJECTED"
    offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(offer)

    recipient_id = offer.buyer_id if is_farmer else produce.farmer_id
    create_notification(
        db=db,
        user_id=recipient_id,
        title="Offer Rejected",
        message=f"Offer for {produce.crop_name} ({offer.quantity} kg @ ₹{offer.offered_price_per_kg}/kg) was rejected. {f'Note: {reason}' if reason else ''}",
        notification_type="OFFER",
        link="/buyer/offers" if is_farmer else "/farmer/offers"
    )

    log_action(
        db=db,
        action="REJECT_OFFER",
        entity_type="BuyerOffer",
        entity_id=offer.id,
        user_id=user.id,
        new_values={"reason": reason}
    )

    return _format_offer_response(offer)

def get_offers_for_farmer(db: Session, farmer: User, produce_id: Optional[int] = None) -> List[OfferResponse]:
    query = db.query(BuyerOffer).join(BuyerOffer.produce).filter(ProduceListing.farmer_id == farmer.id)
    if produce_id:
        query = query.filter(BuyerOffer.produce_id == produce_id)
    offers = query.order_by(BuyerOffer.created_at.desc()).all()
    return [_format_offer_response(off) for off in offers]

def get_offers_for_buyer(db: Session, buyer: User) -> List[OfferResponse]:
    offers = db.query(BuyerOffer).filter(BuyerOffer.buyer_id == buyer.id).order_by(BuyerOffer.created_at.desc()).all()
    return [_format_offer_response(off) for off in offers]
