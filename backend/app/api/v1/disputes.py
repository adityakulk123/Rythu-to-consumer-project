from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.order import Order
from app.models.dispute import Dispute
from app.models.notification import Notification
from app.schemas.dispute import DisputeCreate, DisputeResponse

router = APIRouter()

@router.post("/", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def raise_dispute(
    data: DisputeCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.farmer_id != current_user.id and order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to raise dispute on this order")

    # Set order status to disputed
    order.status = "disputed"

    dispute = Dispute(
        order_id=order.id,
        raised_by_id=current_user.id,
        against_user_id=data.against_user_id,
        dispute_type=data.dispute_type,
        title=data.title,
        description=data.description,
        evidence_photos=data.evidence_photos,
        status="open"
    )
    db.add(dispute)

    # Notify counterparty
    notif = Notification(
        user_id=data.against_user_id,
        type="dispute_raised",
        title=f"Dispute Opened: Order #{order.order_number}",
        message=f"{current_user.full_name} raised a dispute: '{data.title}'. Admin mediation is notified.",
        reference_type="order",
        reference_id=order.id
    )
    db.add(notif)

    db.commit()
    db.refresh(dispute)

    deps.log_audit(db, current_user.id, "RAISE_DISPUTE", "Dispute", dispute.id, f"Type: {data.dispute_type}")
    return dispute


@router.get("/my-disputes", response_model=List[DisputeResponse])
def get_my_disputes(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Dispute).filter(
        (Dispute.raised_by_id == current_user.id) | (Dispute.against_user_id == current_user.id)
    ).order_by(Dispute.created_at.desc()).all()
