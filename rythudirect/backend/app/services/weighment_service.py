from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.weighment import WeighmentRecord, QualityAssessment
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.models.user import User, UserRole
from app.schemas.weighment import WeighmentCreate, WeighmentConfirm, WeighmentResponse, QualityAssessmentCreate, QualityAssessmentResponse
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

def _format_weighment_response(record: WeighmentRecord) -> WeighmentResponse:
    is_fully_confirmed = record.farmer_confirmed and record.buyer_confirmed
    return WeighmentResponse(
        id=record.id,
        order_id=record.order_id,
        original_listed_quantity=record.original_listed_quantity,
        gross_weight=record.gross_weight,
        packaging_weight=record.packaging_weight,
        net_weight=record.net_weight,
        accepted_quantity=record.accepted_quantity,
        rejected_quantity=record.rejected_quantity,
        agreed_price_per_kg=record.agreed_price_per_kg,
        final_payable_amount=record.final_payable_amount,
        quality_grade=record.quality_grade,
        scale_slip_number=record.scale_slip_number,
        photo_evidence_url=record.photo_evidence_url,
        farmer_confirmed=record.farmer_confirmed,
        farmer_confirmed_at=record.farmer_confirmed_at,
        buyer_confirmed=record.buyer_confirmed,
        buyer_confirmed_at=record.buyer_confirmed_at,
        verification_timestamp=record.verification_timestamp,
        notes=record.notes,
        created_at=record.created_at,
        is_fully_confirmed=is_fully_confirmed
    )

def record_weighment(db: Session, order_id: int, user: User, data: WeighmentCreate) -> WeighmentResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if user.id != order.farmer_id and user.id != order.buyer_id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to log weighment for this order.")

    # Check if a weighment already exists
    existing = db.query(WeighmentRecord).filter(WeighmentRecord.order_id == order_id).first()
    if existing and existing.farmer_confirmed and existing.buyer_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This weighment has already been mutually confirmed and locked. It cannot be altered."
        )

    # Core mathematical calculations as strictly specified in Requirement 7:
    # Net Weight = Gross Weight - Packaging Weight
    # Final Amount = Accepted Net Quantity * Agreed Price
    net_weight = data.gross_weight - data.packaging_weight
    if net_weight < Decimal("0"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gross weight cannot be less than packaging weight.")

    accepted_qty = net_weight - data.rejected_quantity
    if accepted_qty < Decimal("0"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejected quantity cannot exceed net weight.")

    final_amount = accepted_qty * order.agreed_price_per_kg

    is_farmer = (user.id == order.farmer_id)
    is_buyer = (user.id == order.buyer_id)

    if existing:
        existing.gross_weight = data.gross_weight
        existing.packaging_weight = data.packaging_weight
        existing.net_weight = net_weight
        existing.accepted_quantity = accepted_qty
        existing.rejected_quantity = data.rejected_quantity
        existing.final_payable_amount = final_amount
        existing.quality_grade = data.quality_grade
        existing.scale_slip_number = data.scale_slip_number
        existing.photo_evidence_url = data.photo_evidence_url
        existing.notes = data.notes
        
        # Confirmation flag for the recording party
        if is_farmer:
            existing.farmer_confirmed = True
            existing.farmer_confirmed_at = datetime.utcnow()
        elif is_buyer:
            existing.buyer_confirmed = True
            existing.buyer_confirmed_at = datetime.utcnow()

        record = existing
    else:
        record = WeighmentRecord(
            order_id=order.id,
            original_listed_quantity=order.agreed_quantity,
            gross_weight=data.gross_weight,
            packaging_weight=data.packaging_weight,
            net_weight=net_weight,
            accepted_quantity=accepted_qty,
            rejected_quantity=data.rejected_quantity,
            agreed_price_per_kg=order.agreed_price_per_kg,
            final_payable_amount=final_amount,
            quality_grade=data.quality_grade,
            scale_slip_number=data.scale_slip_number,
            photo_evidence_url=data.photo_evidence_url,
            farmer_confirmed=is_farmer,
            farmer_confirmed_at=datetime.utcnow() if is_farmer else None,
            buyer_confirmed=is_buyer,
            buyer_confirmed_at=datetime.utcnow() if is_buyer else None,
            notes=data.notes
        )
        db.add(record)

    order.status = "WEIGHMENT_PENDING"
    db.commit()
    db.refresh(record)

    # Check if both now confirmed
    if record.farmer_confirmed and record.buyer_confirmed:
        order.status = "WEIGHMENT_COMPLETED"
        # Synchronize payment transaction amount
        if order.payment_transaction:
            order.payment_transaction.amount = record.final_payable_amount
            order.payment_transaction.outstanding_balance = max(Decimal("0.0"), record.final_payable_amount - order.payment_transaction.advance_amount)
        db.commit()

    # Notify counterparty
    other_party_id = order.buyer_id if is_farmer else order.farmer_id
    create_notification(
        db=db,
        user_id=other_party_id,
        title="Weighment Record Logged",
        message=f"Weighment logged for Order #{order.order_number}: Gross {record.gross_weight} kg, Net {record.net_weight} kg, Payable ₹{record.final_payable_amount}. Please review and confirm.",
        notification_type="WEIGHMENT",
        link=f"/orders/{order.id}"
    )

    log_action(
        db=db,
        action="LOG_WEIGHMENT",
        entity_type="WeighmentRecord",
        entity_id=record.id,
        user_id=user.id,
        new_values={"net_weight": str(net_weight), "payable": str(final_amount)}
    )

    return _format_weighment_response(record)

def confirm_weighment(db: Session, order_id: int, user: User, confirm_data: WeighmentConfirm) -> WeighmentResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not order.weighment_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weighment record not found for this order.")

    record = order.weighment_record

    if user.id == order.farmer_id:
        record.farmer_confirmed = confirm_data.confirm
        record.farmer_confirmed_at = datetime.utcnow()
    elif user.id == order.buyer_id:
        record.buyer_confirmed = confirm_data.confirm
        record.buyer_confirmed_at = datetime.utcnow()
    elif user.role == UserRole.ADMIN:
        record.farmer_confirmed = True
        record.buyer_confirmed = True
        record.farmer_confirmed_at = datetime.utcnow()
        record.buyer_confirmed_at = datetime.utcnow()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to confirm this weighment.")

    if confirm_data.notes:
        record.notes = (record.notes or "") + f" | Confirmation note: {confirm_data.notes}"

    # If both parties have confirmed, lock transaction and update order & payment
    if record.farmer_confirmed and record.buyer_confirmed:
        order.status = "WEIGHMENT_COMPLETED"
        if order.payment_transaction:
            order.payment_transaction.amount = record.final_payable_amount
            order.payment_transaction.outstanding_balance = max(Decimal("0.0"), record.final_payable_amount - order.payment_transaction.advance_amount)
            if order.payment_transaction.advance_amount >= record.final_payable_amount:
                order.payment_transaction.payment_status = "FULLY_PAID"

    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="CONFIRM_WEIGHMENT",
        entity_type="WeighmentRecord",
        entity_id=record.id,
        user_id=user.id,
        new_values={"farmer_confirmed": record.farmer_confirmed, "buyer_confirmed": record.buyer_confirmed}
    )

    return _format_weighment_response(record)

def get_weighment_by_order(db: Session, order_id: int, user: User) -> Optional[WeighmentResponse]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if user.id != order.farmer_id and user.id != order.buyer_id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this record.")

    if not order.weighment_record:
        return None

    return _format_weighment_response(order.weighment_record)
