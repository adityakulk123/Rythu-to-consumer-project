from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.api import deps
from app.models.user import User, BuyerProfile
from app.models.produce import ProduceListing, CropCategory, ProduceImage
from app.models.offer import BuyerOffer, OfferNegotiation
from app.models.order import Order, WeighmentRecord, QualityAssessment
from app.models.payment import PaymentTransaction
from app.models.notification import Notification
from app.schemas.produce import ProducePublicResponse, CropCategoryResponse
from app.schemas.offer import OfferCreate, OfferResponse, OfferCounter
from app.schemas.order import (
    OrderResponse,
    WeighmentRecordCreate,
    WeighmentRecordResponse,
    QualityAssessmentCreate
)

router = APIRouter()

# ----------------- PRODUCE DISCOVERY & DETAILS -----------------

@router.get("/categories", response_model=List[CropCategoryResponse])
def get_categories(db: Session = Depends(deps.get_db)):
    return db.query(CropCategory).filter(CropCategory.is_active == True).all()


@router.get("/produce", response_model=dict)
def browse_produce(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    district: Optional[str] = None,
    quality_grade: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_quantity: Optional[float] = None,
    delivery_option: Optional[str] = None,
    sort_by: Optional[str] = "latest",  # 'latest', 'price_asc', 'price_desc', 'qty_desc'
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(deps.get_db)
):
    query = db.query(ProduceListing).filter(
        ProduceListing.status.in_(["active", "partially_sold"]),
        ProduceListing.available_quantity > 0
    )

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                ProduceListing.crop_name.ilike(search_filter),
                ProduceListing.variety.ilike(search_filter),
                ProduceListing.village.ilike(search_filter),
                ProduceListing.district.ilike(search_filter)
            )
        )

    if category_id:
        query = query.filter(ProduceListing.category_id == category_id)

    if district:
        query = query.filter(ProduceListing.district.ilike(f"%{district}%"))

    if quality_grade:
        query = query.filter(ProduceListing.quality_grade == quality_grade)

    if min_price is not None:
        query = query.filter(ProduceListing.asking_price_per_unit >= min_price)

    if max_price is not None:
        query = query.filter(ProduceListing.asking_price_per_unit <= max_price)

    if min_quantity is not None:
        query = query.filter(ProduceListing.available_quantity >= min_quantity)

    if delivery_option:
        query = query.filter(
            or_(
                ProduceListing.delivery_options == delivery_option,
                ProduceListing.delivery_options == "both"
            )
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(ProduceListing.asking_price_per_unit.asc())
    elif sort_by == "price_desc":
        query = query.order_by(ProduceListing.asking_price_per_unit.desc())
    elif sort_by == "qty_desc":
        query = query.order_by(ProduceListing.available_quantity.desc())
    else:  # latest
        query = query.order_by(ProduceListing.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    listings = query.offset(offset).limit(limit).all()

    # Note: ProducePublicResponse guarantees min_acceptable_price is excluded
    serialized = [ProducePublicResponse.model_validate(item) for item in listings]

    return {
        "items": serialized,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }


@router.get("/produce/{id}", response_model=ProducePublicResponse)
def get_produce_detail(id: int, db: Session = Depends(deps.get_db)):
    listing = db.query(ProduceListing).filter(ProduceListing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found")
    # min_acceptable_price is strictly NOT exposed in ProducePublicResponse
    return ProducePublicResponse.model_validate(listing)


# ----------------- OFFERS & NEGOTIATION -----------------

@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def submit_offer(
    data: OfferCreate,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    produce = db.query(ProduceListing).filter(ProduceListing.id == data.produce_id).first()
    if not produce:
        raise HTTPException(status_code=404, detail="Produce listing not found")

    if produce.status not in ["active", "partially_sold"]:
        raise HTTPException(status_code=400, detail="This produce listing is no longer open for offers")

    if data.requested_quantity > produce.available_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({data.requested_quantity} {produce.unit}) exceeds currently available stock of {produce.available_quantity} {produce.unit}"
        )

    # Check buyer's pending offers on this produce
    existing_offer = db.query(BuyerOffer).filter(
        BuyerOffer.produce_id == data.produce_id,
        BuyerOffer.buyer_id == current_buyer.id,
        BuyerOffer.status.in_(["pending", "countered"])
    ).first()

    if existing_offer:
        raise HTTPException(
            status_code=400,
            detail="You already have an active offer under negotiation for this produce. You may counter or manage it in your Offers tab."
        )

    total_value = data.requested_quantity * data.offered_price_per_unit

    offer = BuyerOffer(
        produce_id=data.produce_id,
        buyer_id=current_buyer.id,
        requested_quantity=data.requested_quantity,
        offered_price_per_unit=data.offered_price_per_unit,
        total_offer_value=total_value,
        preferred_delivery_date=data.preferred_delivery_date,
        delivery_method=data.delivery_method,
        additional_requirements=data.additional_requirements,
        status="pending"
    )
    db.add(offer)
    db.flush()

    # Initial negotiation entry
    neg = OfferNegotiation(
        offer_id=offer.id,
        sender_id=current_buyer.id,
        counter_price_per_unit=data.offered_price_per_unit,
        counter_quantity=data.requested_quantity,
        message=f"Initial offer submitted: ₹{data.offered_price_per_unit}/{produce.unit} for {data.requested_quantity} {produce.unit}.",
        status="proposed"
    )
    db.add(neg)

    # Notify Farmer
    notif = Notification(
        user_id=produce.farmer_id,
        type="new_offer",
        title=f"New Offer for {produce.crop_name}",
        message=f"{current_buyer.full_name} offered ₹{data.offered_price_per_unit}/{produce.unit} for {data.requested_quantity} {produce.unit} (Total: ₹{total_value:,.2f})",
        reference_type="offer",
        reference_id=offer.id
    )
    db.add(notif)
    db.commit()
    db.refresh(offer)

    deps.log_audit(db, current_buyer.id, "SUBMIT_OFFER", "BuyerOffer", offer.id, f"Offered ₹{data.offered_price_per_unit} for {data.requested_quantity}")
    return offer


@router.get("/offers", response_model=List[OfferResponse])
def get_buyer_offers(
    status_filter: Optional[str] = None,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    query = db.query(BuyerOffer).filter(BuyerOffer.buyer_id == current_buyer.id)
    if status_filter:
        query = query.filter(BuyerOffer.status == status_filter)
    return query.order_by(BuyerOffer.created_at.desc()).all()


@router.post("/offers/{id}/counter-respond")
def buyer_respond_to_counter(
    id: int,
    action: str,  # 'accept', 'counter', 'reject'
    counter_data: Optional[OfferCounter] = None,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    offer = db.query(BuyerOffer).filter(
        BuyerOffer.id == id,
        BuyerOffer.buyer_id == current_buyer.id
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status not in ["countered", "pending"]:
        raise HTTPException(status_code=400, detail=f"Offer cannot be modified in status '{offer.status}'")

    if action == "counter":
        if not counter_data:
            raise HTTPException(status_code=400, detail="Counter data required")
        if counter_data.counter_quantity > offer.produce.available_quantity:
            raise HTTPException(status_code=400, detail="Counter quantity exceeds available stock")

        neg = OfferNegotiation(
            offer_id=offer.id,
            sender_id=current_buyer.id,
            counter_price_per_unit=counter_data.counter_price_per_unit,
            counter_quantity=counter_data.counter_quantity,
            message=counter_data.message,
            status="proposed"
        )
        db.add(neg)
        offer.current_agreed_price = counter_data.counter_price_per_unit
        offer.current_agreed_quantity = counter_data.counter_quantity
        offer.status = "countered"

        # Notify Farmer
        notif = Notification(
            user_id=offer.produce.farmer_id,
            type="counteroffer",
            title=f"Buyer Counter-Offer for {offer.produce.crop_name}",
            message=f"{current_buyer.full_name} proposed ₹{counter_data.counter_price_per_unit}/{offer.produce.unit} for {counter_data.counter_quantity} {offer.produce.unit}.",
            reference_type="offer",
            reference_id=offer.id
        )
        db.add(notif)
        db.commit()
        return {"message": "Counter-offer sent to farmer"}

    elif action == "reject":
        offer.status = "rejected"
        db.commit()
        return {"message": "Offer declined"}

    elif action == "accept":
        # Buyer accepts farmer's latest terms, farmer can now confirm or order is auto-ready
        offer.status = "accepted"
        db.commit()
        return {"message": "Terms accepted. Waiting for farmer dispatch / order confirmation."}

    raise HTTPException(status_code=400, detail="Invalid action")


# ----------------- ORDERS & WEIGHMENT -----------------

@router.get("/orders", response_model=List[OrderResponse])
def get_buyer_orders(
    status_filter: Optional[str] = None,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Order).filter(Order.buyer_id == current_buyer.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).all()


@router.post("/orders/{id}/confirm-delivery")
def confirm_delivery(
    id: int,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == id,
        Order.buyer_id == current_buyer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = "delivered"
    order.updated_at = datetime.utcnow()

    # Notify farmer
    notif = Notification(
        user_id=order.farmer_id,
        type="delivery_confirmed",
        title=f"Delivery Confirmed: Order #{order.order_number}",
        message=f"Buyer confirmed delivery for {order.produce.crop_name}. Proceed to weighment verification.",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)
    db.commit()

    deps.log_audit(db, current_buyer.id, "CONFIRM_DELIVERY", "Order", order.id)
    return {"message": "Delivery confirmed. You may now complete weighment and quality assessment."}


@router.post("/orders/{id}/record-weighment", response_model=WeighmentRecordResponse)
def record_weighment(
    id: int,
    data: WeighmentRecordCreate,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == id,
        Order.buyer_id == current_buyer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Formula per Section 14:
    # Net Weight = Gross Weight - Packaging Weight
    net_weight = data.gross_weight - data.packaging_weight
    if net_weight <= 0:
        raise HTTPException(status_code=400, detail="Net weight must be greater than zero")

    # Accepted + Rejected check
    if data.accepted_quantity > net_weight:
        raise HTTPException(
            status_code=400,
            detail=f"Accepted quantity ({data.accepted_quantity}) cannot exceed calculated net weight ({net_weight})"
        )

    # Formula per Section 14:
    # Final Amount = Accepted Net Quantity * Agreed Price
    final_amount = round(data.accepted_quantity * order.agreed_price_per_unit, 2)

    weighment = db.query(WeighmentRecord).filter(WeighmentRecord.order_id == order.id).first()
    if not weighment:
        weighment = WeighmentRecord(
            order_id=order.id,
            original_listing_quantity=order.quantity,
            gross_weight=data.gross_weight,
            packaging_weight=data.packaging_weight,
            net_weight=net_weight,
            accepted_quantity=data.accepted_quantity,
            rejected_quantity=data.rejected_quantity,
            rejection_reason=data.rejection_reason,
            agreed_price=order.agreed_price_per_unit,
            calculated_final_amount=final_amount,
            scale_type=data.scale_type,
            weighment_slip_photo_url=data.weighment_slip_photo_url,
            produce_photo_url=data.produce_photo_url,
            buyer_confirmed=True,
            buyer_confirmed_at=datetime.utcnow()
        )
        db.add(weighment)
    else:
        # Prevent silent modification if farmer already confirmed
        if weighment.farmer_confirmed:
            raise HTTPException(
                status_code=400,
                detail="Cannot alter weighment record after mutual confirmation. Raise a dispute if there is an error."
            )
        weighment.gross_weight = data.gross_weight
        weighment.packaging_weight = data.packaging_weight
        weighment.net_weight = net_weight
        weighment.accepted_quantity = data.accepted_quantity
        weighment.rejected_quantity = data.rejected_quantity
        weighment.rejection_reason = data.rejection_reason
        weighment.calculated_final_amount = final_amount
        weighment.scale_type = data.scale_type
        weighment.weighment_slip_photo_url = data.weighment_slip_photo_url
        weighment.produce_photo_url = data.produce_photo_url
        weighment.buyer_confirmed = True
        weighment.buyer_confirmed_at = datetime.utcnow()

    order.status = "verification_pending"
    order.final_payable_amount = final_amount

    # Notify farmer for counter-confirmation
    notif = Notification(
        user_id=order.farmer_id,
        type="weighment_submitted",
        title=f"Weighment Recorded for Order #{order.order_number}",
        message=f"Buyer recorded net weight: {net_weight} {order.produce.unit}, accepted: {data.accepted_quantity} {order.produce.unit}. Final payable amount: ₹{final_amount:,.2f}. Please confirm in your dashboard.",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)

    db.commit()
    db.refresh(weighment)

    deps.log_audit(db, current_buyer.id, "RECORD_WEIGHMENT", "WeighmentRecord", weighment.id, f"Net weight: {net_weight}, Final amount: ₹{final_amount}")
    return weighment


@router.post("/orders/{id}/record-quality")
def record_quality(
    id: int,
    data: QualityAssessmentCreate,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == id,
        Order.buyer_id == current_buyer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    qa = db.query(QualityAssessment).filter(QualityAssessment.order_id == order.id).first()
    if not qa:
        qa = QualityAssessment(
            order_id=order.id,
            assessed_by=f"{current_buyer.full_name} (Buyer)",
            grade=data.grade,
            moisture_content_pct=data.moisture_content_pct,
            foreign_matter_pct=data.foreign_matter_pct,
            damage_rot_pct=data.damage_rot_pct,
            notes=data.notes,
            photos=data.photos
        )
        db.add(qa)
    else:
        qa.grade = data.grade
        qa.moisture_content_pct = data.moisture_content_pct
        qa.foreign_matter_pct = data.foreign_matter_pct
        qa.damage_rot_pct = data.damage_rot_pct
        qa.notes = data.notes

    db.commit()
    return {"message": "Quality assessment recorded successfully"}


# ----------------- BUYER METRICS -----------------

@router.get("/metrics")
def get_buyer_metrics(
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    available_produce = db.query(ProduceListing).filter(
        ProduceListing.status.in_(["active", "partially_sold"]),
        ProduceListing.available_quantity > 0
    ).count()

    active_offers = db.query(BuyerOffer).filter(
        BuyerOffer.buyer_id == current_buyer.id,
        BuyerOffer.status.in_(["pending", "countered", "accepted"])
    ).count()

    pending_orders = db.query(Order).filter(
        Order.buyer_id == current_buyer.id,
        Order.status.in_(["order_confirmed", "preparing", "ready_for_pickup", "in_transit", "delivered", "verification_pending"])
    ).count()

    completed_orders = db.query(Order).filter(
        Order.buyer_id == current_buyer.id,
        Order.status.in_(["completed", "verification_completed"])
    ).count()

    total_purchases = db.query(func.coalesce(func.sum(PaymentTransaction.amount), 0.0)).filter(
        PaymentTransaction.payer_id == current_buyer.id,
        PaymentTransaction.status == "completed"
    ).scalar()

    return {
        "available_produce": available_produce,
        "active_offers": active_offers,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_purchases": round(total_purchases, 2)
    }
