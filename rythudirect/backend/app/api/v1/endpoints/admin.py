from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, BuyerProfile, BuyerVerification, UserRole
from app.models.produce import ProduceListing, CropCategory
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.models.dispute import Dispute
from app.schemas.user import UserResponse
from app.schemas.dispute import DisputeResponse, DisputeResolve
from app.schemas.produce import CropCategoryCreate, CropCategoryResponse
from app.services.dispute_service import get_disputes, resolve_dispute
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

router = APIRouter()

@router.get("/dashboard")
def get_admin_dashboard(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Administrator Dashboard Metrics:
    - Total farmers
    - Total verified buyers
    - Total produce listings
    - Total transactions
    - Total transaction value
    - Pending disputes
    - Pending buyer verifications
    """
    total_farmers = db.query(func.count(User.id)).filter(User.role == UserRole.FARMER).scalar() or 0
    total_buyers = db.query(func.count(User.id)).filter(User.role == UserRole.BUYER).scalar() or 0
    total_verified_buyers = db.query(func.count(BuyerProfile.id)).filter(BuyerProfile.is_verified == True).scalar() or 0
    
    total_produce_listings = db.query(func.count(ProduceListing.id)).scalar() or 0
    active_produce_listings = db.query(func.count(ProduceListing.id)).filter(ProduceListing.status.in_(["ACTIVE", "PARTIALLY_SOLD"])).scalar() or 0

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "COMPLETED").scalar() or 0

    payments = db.query(PaymentTransaction).filter(
        PaymentTransaction.payment_status.in_(["FULLY_PAID", "ADVANCE_PAID", "PARTIALLY_PAID"])
    ).all()
    total_transaction_value = sum([p.amount if p.payment_status == "FULLY_PAID" else p.advance_amount for p in payments], Decimal("0.0"))

    pending_disputes = db.query(func.count(Dispute.id)).filter(Dispute.status == "OPEN").scalar() or 0
    pending_verifications = db.query(func.count(BuyerVerification.id)).filter(BuyerVerification.status == "PENDING").scalar() or 0

    return {
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "total_verified_buyers": total_verified_buyers,
        "total_produce_listings": total_produce_listings,
        "active_produce_listings": active_produce_listings,
        "total_transactions": total_orders,
        "completed_orders": completed_orders,
        "total_transaction_value": float(total_transaction_value),
        "pending_disputes": pending_disputes,
        "pending_buyer_verifications": pending_verifications
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(role: Optional[str] = None, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """View all registered users with role filter."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    return query.order_by(User.created_at.desc()).all()

@router.post("/buyers/{id}/verify")
def verify_buyer(id: int, status_update: str, notes: Optional[str] = None, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Approve or reject a buyer verification."""
    profile = db.query(BuyerProfile).filter(BuyerProfile.id == id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyer profile not found.")

    status_update = status_update.upper()
    if status_update not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be APPROVED or REJECTED.")

    profile.is_verified = (status_update == "APPROVED")
    
    # Update latest verification document if present
    verification = db.query(BuyerVerification).filter(BuyerVerification.buyer_id == profile.id).order_by(BuyerVerification.submitted_at.desc()).first()
    if verification:
        verification.status = status_update
        verification.admin_notes = notes
        verification.reviewed_at = datetime.utcnow()
        verification.reviewed_by_id = admin.id

    db.commit()

    # Notify buyer
    create_notification(
        db=db,
        user_id=profile.user_id,
        title=f"Verification Update: {status_update}",
        message=f"Your business verification status is now {status_update}. {f'Notes: {notes}' if notes else ''}",
        notification_type="INFO",
        link="/buyer/dashboard"
    )

    log_action(
        db=db,
        action="VERIFY_BUYER",
        entity_type="BuyerProfile",
        entity_id=profile.id,
        user_id=admin.id,
        new_values={"status": status_update, "notes": notes}
    )

    return {"message": f"Buyer verification status updated to {status_update}", "is_verified": profile.is_verified}

@router.get("/disputes", response_model=List[DisputeResponse])
def get_all_disputes(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin review of all reported disputes."""
    return get_disputes(db, admin)

@router.post("/disputes/{id}/resolve", response_model=DisputeResponse)
def resolve_order_dispute(id: int, data: DisputeResolve, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Mediate and resolve an active dispute."""
    return resolve_dispute(db, admin, id, data)

@router.post("/users/{id}/toggle-status")
def toggle_user_active_status(id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Suspend or reactivate a user account."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    user.is_active = not user.is_active
    db.commit()

    log_action(
        db=db,
        action="TOGGLE_USER_STATUS",
        entity_type="User",
        entity_id=user.id,
        user_id=admin.id,
        new_values={"is_active": user.is_active}
    )

    return {"message": f"User {'activated' if user.is_active else 'suspended'} successfully", "is_active": user.is_active}

@router.get("/categories", response_model=List[CropCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """List all crop categories."""
    return db.query(CropCategory).filter(CropCategory.is_active == True).all()

@router.post("/categories", response_model=CropCategoryResponse)
def create_category(data: CropCategoryCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Add a new crop category."""
    cat = CropCategory(name=data.name, description=data.description, icon=data.icon, is_active=data.is_active)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/metrics", status_code=status.HTTP_200_OK)
def get_admin_metrics(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves collected server metrics from Supabase PostgreSQL for the Admin Console.
    Restricted to authenticated Admin users only.
    Returns records sorted by collection timestamp in descending order (latest first).
    """
    from sqlalchemy import desc
    from app.models.metric import Metric
    total = db.query(Metric).count()
    records = (
        db.query(Metric)
        .order_by(desc(Metric.collected_at), desc(Metric.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": m.id,
                "cpu_percent": m.cpu_percent,
                "ram_percent": m.ram_percent,
                "ram_total": m.ram_total,
                "ram_used": m.ram_used,
                "disk_percent": m.disk_percent,
                "disk_total": m.disk_total,
                "disk_used": m.disk_used,
                "network_bytes_sent": m.network_bytes_sent,
                "network_bytes_recv": m.network_bytes_recv,
                "server_uptime_seconds": m.server_uptime_seconds,
                "collected_at": m.collected_at.isoformat(),
            }
            for m in records
        ]
    }
