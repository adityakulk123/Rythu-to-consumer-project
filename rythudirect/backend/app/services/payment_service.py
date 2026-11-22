import uuid
from typing import Optional, List
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import PaymentTransaction
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.payment import PaymentProcessRequest, PaymentTransactionResponse, ReceiptResponse
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

def _format_payment_response(payment: PaymentTransaction) -> PaymentTransactionResponse:
    return PaymentTransactionResponse(
        id=payment.id,
        order_id=payment.order_id,
        transaction_reference=payment.transaction_reference,
        amount=payment.amount,
        advance_amount=payment.advance_amount,
        outstanding_balance=payment.outstanding_balance,
        payment_status=payment.payment_status,
        payment_method=payment.payment_method,
        due_date=payment.due_date,
        confirmed_at=payment.confirmed_at,
        receipt_number=payment.receipt_number,
        gateway_response=payment.gateway_response,
        created_at=payment.created_at
    )

def process_payment(db: Session, buyer: User, data: PaymentProcessRequest) -> PaymentTransactionResponse:
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.buyer_id != buyer.id and buyer.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can make payments for this order.")

    payment = order.payment_transaction
    if not payment:
        payment = PaymentTransaction(
            order_id=order.id,
            transaction_reference=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            amount=order.total_estimated_amount,
            advance_amount=Decimal("0.0"),
            outstanding_balance=order.total_estimated_amount,
            payment_status="PAYMENT_PENDING",
            payment_method=data.payment_method
        )
        db.add(payment)
        db.flush()

    total_order_amount = payment.amount
    now = datetime.utcnow()
    ref = f"GATEWAY-SUCCESS-{uuid.uuid4().hex[:10].upper()}"
    receipt = f"REC-RYTHU-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    if data.payment_type == "ADVANCE":
        # Calculate 20% standard advance if not explicitly set
        advance_to_pay = data.amount if data.amount else round(total_order_amount * Decimal("0.20"), 2)
        payment.advance_amount = advance_to_pay
        payment.outstanding_balance = max(Decimal("0.0"), total_order_amount - advance_to_pay)
        payment.payment_status = "ADVANCE_PAID"
        payment.due_date = (now + timedelta(days=7)).date()

    elif data.payment_type == "FULL":
        payment.advance_amount = total_order_amount
        payment.outstanding_balance = Decimal("0.0")
        payment.payment_status = "FULLY_PAID"
        order.status = "COMPLETED"

    elif data.payment_type == "BALANCE":
        payment.advance_amount = total_order_amount
        payment.outstanding_balance = Decimal("0.0")
        payment.payment_status = "FULLY_PAID"
        order.status = "COMPLETED"

    payment.transaction_reference = ref
    payment.payment_method = data.payment_method
    payment.confirmed_at = now
    payment.receipt_number = receipt
    payment.gateway_response = f'{{"gateway": "RythuDirect Escrow Provider", "status": "VERIFIED_SUCCESS", "timestamp": "{now.isoformat()}"}}'

    # Increment buyer completed deals counter
    if order.buyer.buyer_profile:
        order.buyer.buyer_profile.total_deals_completed += 1

    db.commit()
    db.refresh(payment)
    db.refresh(order)

    # Notifications
    create_notification(
        db=db,
        user_id=order.farmer_id,
        title=f"Payment Received: ₹{payment.amount if data.payment_type == 'FULL' else payment.advance_amount}",
        message=f"Buyer {buyer.full_name} processed {data.payment_type} payment for Order #{order.order_number}. Receipt #{receipt}.",
        notification_type="PAYMENT",
        link=f"/farmer/payments"
    )

    create_notification(
        db=db,
        user_id=buyer.id,
        title="Payment Successful",
        message=f"Your payment of ₹{payment.amount if data.payment_type == 'FULL' else payment.advance_amount} for Order #{order.order_number} is verified. Receipt #{receipt}.",
        notification_type="PAYMENT",
        link=f"/buyer/orders"
    )

    log_action(
        db=db,
        action="PROCESS_PAYMENT",
        entity_type="PaymentTransaction",
        entity_id=payment.id,
        user_id=buyer.id,
        new_values={"payment_type": data.payment_type, "status": payment.payment_status, "receipt": receipt}
    )

    return _format_payment_response(payment)

def get_receipt(db: Session, order_id: int, user: User) -> ReceiptResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not order.payment_transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record or order not found.")

    if user.id != order.farmer_id and user.id != order.buyer_id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this receipt.")

    p = order.payment_transaction
    crop_name = order.produce.crop_name if order.produce else "Agricultural Produce"

    paid_amt = p.amount if p.payment_status == "FULLY_PAID" else p.advance_amount

    return ReceiptResponse(
        receipt_number=p.receipt_number or f"REC-{p.id}",
        order_number=order.order_number,
        transaction_reference=p.transaction_reference,
        farmer_name=order.farmer.full_name if order.farmer else "Farmer",
        buyer_name=order.buyer.full_name if order.buyer else "Buyer",
        crop_name=crop_name,
        quantity=order.agreed_quantity,
        unit_price=order.agreed_price_per_kg,
        total_amount=p.amount,
        paid_amount=paid_amt,
        outstanding_balance=p.outstanding_balance,
        payment_status=p.payment_status,
        payment_method=p.payment_method,
        issued_date=p.confirmed_at or p.created_at
    )
