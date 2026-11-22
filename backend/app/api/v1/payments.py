from typing import List, Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.models.notification import Notification
from app.schemas.payment import PaymentProcessRequest, PaymentResponse

router = APIRouter()

@router.post("/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(
    data: PaymentProcessRequest,
    current_buyer: User = Depends(deps.get_current_active_buyer),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(
        Order.id == data.order_id,
        Order.buyer_id == current_buyer.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payable_total = order.final_payable_amount if order.final_payable_amount else order.initial_total_amount
    existing_paid = order.advance_amount_paid or 0.0
    remaining_balance = payable_total - existing_paid

    if data.amount > (remaining_balance + 0.01):
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (₹{data.amount:,.2f}) exceeds remaining order balance (₹{remaining_balance:,.2f})"
        )

    # In development mode, mock payment gateway is used and explicitly marked as DEMO
    is_demo = (settings.PAYMENT_GATEWAY_PROVIDER == "mock_demo")
    tx_ref = f"RD-TXN-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:6].upper()}"
    receipt_no = f"RCP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

    tx = PaymentTransaction(
        order_id=order.id,
        payer_id=current_buyer.id,
        payee_id=order.farmer_id,
        amount=data.amount,
        payment_stage=data.payment_stage,
        payment_method=data.payment_method,
        transaction_reference=tx_ref,
        receipt_number=receipt_no,
        is_demo=is_demo,
        demo_badge_text="DEMO SIMULATION" if is_demo else "LIVE PAYMENT",
        status="completed",
        notes=data.notes,
        confirmed_at=datetime.utcnow()
    )
    db.add(tx)

    # Update order payment status
    order.advance_amount_paid = existing_paid + data.amount
    if order.advance_amount_paid >= (payable_total - 0.5):
        order.payment_status = "fully_paid"
        if order.status in ["verification_completed", "delivered"]:
            order.status = "completed"
    else:
        order.payment_status = "partially_paid" if data.payment_stage != "advance" else "advance_paid"

    order.updated_at = datetime.utcnow()

    # Notify farmer of payment received
    notif = Notification(
        user_id=order.farmer_id,
        type="payment_received",
        title=f"Payment Received: ₹{data.amount:,.2f}",
        message=f"Buyer {current_buyer.full_name} transferred ₹{data.amount:,.2f} via {data.payment_method.upper()} for Order #{order.order_number}. Receipt #{receipt_no}.",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)

    db.commit()
    db.refresh(tx)

    deps.log_audit(db, current_buyer.id, "PROCESS_PAYMENT", "PaymentTransaction", tx.id, f"Amount: ₹{data.amount}, Receipt: {receipt_no}")
    return tx


@router.get("/receipt/{receipt_number}")
def get_payment_receipt(
    receipt_number: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.receipt_number == receipt_number
    ).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Receipt not found")

    if current_user.role != "admin" and tx.payer_id != current_user.id and tx.payee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this receipt")

    return {
        "receipt_number": tx.receipt_number,
        "transaction_reference": tx.transaction_reference,
        "amount": tx.amount,
        "payment_method": tx.payment_method,
        "payment_stage": tx.payment_stage,
        "is_demo": tx.is_demo,
        "demo_badge_text": tx.demo_badge_text,
        "status": tx.status,
        "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None,
        "order": {
            "order_number": tx.order.order_number,
            "crop_name": tx.order.produce.crop_name,
            "quantity": tx.order.quantity,
            "unit": tx.order.produce.unit,
            "agreed_price": tx.order.agreed_price_per_unit,
            "initial_total": tx.order.initial_total_amount,
            "final_payable": tx.order.final_payable_amount
        },
        "payer": {
            "name": tx.payer.full_name,
            "mobile": tx.payer.mobile_number,
            "business": tx.payer.buyer_profile.business_name if tx.payer.buyer_profile else None
        },
        "payee": {
            "name": tx.payee.full_name,
            "mobile": tx.payee.mobile_number,
            "farm_name": tx.payee.farmer_profile.farm_name if tx.payee.farmer_profile else None
        }
    }


@router.get("/history", response_model=List[PaymentResponse])
def get_user_payment_history(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role == "farmer":
        return db.query(PaymentTransaction).filter(PaymentTransaction.payee_id == current_user.id).order_by(PaymentTransaction.created_at.desc()).all()
    elif current_user.role == "buyer":
        return db.query(PaymentTransaction).filter(PaymentTransaction.payer_id == current_user.id).order_by(PaymentTransaction.created_at.desc()).all()
    else:  # Admin
        return db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(100).all()
