from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.dispute import Dispute
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.dispute import DisputeCreate, DisputeResolve, DisputeResponse
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

def _format_dispute_response(dispute: Dispute) -> DisputeResponse:
    return DisputeResponse(
        id=dispute.id,
        order_id=dispute.order_id,
        order_number=dispute.order.order_number if dispute.order else None,
        raised_by_id=dispute.raised_by_id,
        raised_by_name=dispute.raised_by.full_name if dispute.raised_by else None,
        raised_by_role=dispute.raised_by.role if dispute.raised_by else None,
        reason=dispute.reason,
        description=dispute.description,
        evidence_urls=dispute.evidence_urls,
        status=dispute.status,
        resolution_notes=dispute.resolution_notes,
        resolved_by_id=dispute.resolved_by_id,
        created_at=dispute.created_at,
        resolved_at=dispute.resolved_at
    )

def create_dispute(db: Session, user: User, data: DisputeCreate) -> DisputeResponse:
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if user.id != order.farmer_id and user.id != order.buyer_id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only order participants can raise a dispute.")

    dispute = Dispute(
        order_id=order.id,
        raised_by_id=user.id,
        reason=data.reason,
        description=data.description,
        evidence_urls=data.evidence_urls,
        status="OPEN"
    )
    db.add(dispute)
    order.status = "DISPUTED"
    if order.payment_transaction:
        order.payment_transaction.payment_status = "DISPUTED"

    db.commit()
    db.refresh(dispute)

    # Notify other party & admins
    other_user_id = order.buyer_id if user.id == order.farmer_id else order.farmer_id
    create_notification(
        db=db,
        user_id=other_user_id,
        title=f"Dispute Raised on Order #{order.order_number}",
        message=f"{user.full_name} has raised a dispute ({data.reason}). RythuDirect Admin arbitration has been initiated.",
        notification_type="DISPUTE",
        link=f"/orders/{order.id}"
    )

    log_action(
        db=db,
        action="RAISE_DISPUTE",
        entity_type="Dispute",
        entity_id=dispute.id,
        user_id=user.id,
        new_values={"reason": data.reason, "order_id": order.id}
    )

    return _format_dispute_response(dispute)

def resolve_dispute(db: Session, admin: User, dispute_id: int, data: DisputeResolve) -> DisputeResponse:
    if admin.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only platform administrators can resolve disputes.")

    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")

    dispute.status = data.status
    dispute.resolution_notes = data.resolution_notes
    dispute.resolved_by_id = admin.id
    dispute.resolved_at = datetime.utcnow()

    # If resolved, update order status
    order = dispute.order
    if order:
        order.status = "COMPLETED" if data.status == "RESOLVED" else "CONFIRMED"
        if order.payment_transaction and order.payment_transaction.payment_status == "DISPUTED":
            order.payment_transaction.payment_status = "PARTIALLY_PAID"

    db.commit()
    db.refresh(dispute)

    # Notify participants
    for uid in [dispute.order.farmer_id, dispute.order.buyer_id]:
        create_notification(
            db=db,
            user_id=uid,
            title=f"Dispute Update on Order #{dispute.order.order_number}",
            message=f"Administrator resolved the dispute with status: {data.status}. Resolution: {data.resolution_notes}",
            notification_type="DISPUTE",
            link=f"/orders/{dispute.order.id}"
        )

    log_action(
        db=db,
        action="RESOLVE_DISPUTE",
        entity_type="Dispute",
        entity_id=dispute.id,
        user_id=admin.id,
        new_values={"status": data.status, "notes": data.resolution_notes}
    )

    return _format_dispute_response(dispute)

def get_disputes(db: Session, user: User) -> List[DisputeResponse]:
    if user.role == UserRole.ADMIN:
        disputes = db.query(Dispute).order_by(Dispute.created_at.desc()).all()
    else:
        disputes = db.query(Dispute).filter(Dispute.raised_by_id == user.id).order_by(Dispute.created_at.desc()).all()
    return [_format_dispute_response(d) for d in disputes]
