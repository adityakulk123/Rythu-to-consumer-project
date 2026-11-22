from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.user import User, FarmerProfile, BuyerProfile, BuyerVerification
from app.models.produce import ProduceListing, CropCategory
from app.models.order import Order
from app.models.payment import PaymentTransaction
from app.models.dispute import Dispute
from app.models.notification import Notification
from app.schemas.auth import UserResponse
from app.schemas.order import OrderResponse
from app.schemas.dispute import DisputeResponse, DisputeResolve
from app.schemas.payment import PaymentResponse

router = APIRouter()

@router.get("/dashboard")
def get_admin_dashboard_metrics(
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    total_farmers = db.query(User).filter(User.role == "farmer").count()
    total_buyers = db.query(User).filter(User.role == "buyer").count()
    verified_buyers = db.query(BuyerProfile).filter(BuyerProfile.verification_status == "verified").count()
    pending_verifications = db.query(BuyerProfile).filter(BuyerProfile.verification_status == "pending").count()
    
    active_listings = db.query(ProduceListing).filter(ProduceListing.status == "active").count()
    total_orders = db.query(Order).count()
    
    total_tx_value = db.query(func.coalesce(func.sum(PaymentTransaction.amount), 0.0)).filter(
        PaymentTransaction.status == "completed"
    ).scalar()

    pending_disputes = db.query(Dispute).filter(Dispute.status.in_(["open", "under_investigation"])).count()

    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_disputes = db.query(Dispute).order_by(Dispute.created_at.desc()).limit(5).all()

    return {
        "metrics": {
            "total_farmers": total_farmers,
            "total_buyers": total_buyers,
            "verified_buyers": verified_buyers,
            "pending_verifications": pending_verifications,
            "active_listings": active_listings,
            "total_orders": total_orders,
            "total_transaction_value": round(total_tx_value, 2),
            "pending_disputes": pending_disputes
        },
        "recent_orders": [OrderResponse.model_validate(o) for o in recent_orders],
        "recent_disputes": [DisputeResponse.model_validate(d) for d in recent_disputes]
    }


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: Optional[str] = None,
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


@router.patch("/users/{id}/toggle-status")
def toggle_user_status(
    id: int,
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot alter own admin account status")

    user.is_active = not user.is_active
    db.commit()

    deps.log_audit(db, admin.id, "TOGGLE_USER_STATUS", "User", user.id, f"Active: {user.is_active}")
    return {"message": f"User status set to {'active' if user.is_active else 'suspended'}", "is_active": user.is_active}


@router.get("/buyers/pending-verifications")
def get_pending_buyer_verifications(
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    profiles = db.query(BuyerProfile).filter(BuyerProfile.verification_status == "pending").all()
    results = []
    for bp in profiles:
        results.append({
            "buyer_id": bp.user_id,
            "profile_id": bp.id,
            "full_name": bp.user.full_name,
            "mobile_number": bp.user.mobile_number,
            "business_name": bp.business_name,
            "business_type": bp.business_type,
            "business_address": bp.business_address,
            "buyer_category": bp.buyer_category,
            "gstin_pan": bp.gstin_pan,
            "created_at": bp.created_at.isoformat()
        })
    return results


@router.post("/buyers/{id}/verify")
def verify_buyer(
    id: int,
    action: str,  # 'approve', 'reject'
    notes: Optional[str] = None,
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Buyer profile not found")

    if action == "approve":
        profile.verification_status = "verified"
        profile.verified_at = datetime.utcnow()
        profile.verification_notes = notes or "Verified by Platform Administrator"
        msg = "Your buyer account has been verified! You now have verified buyer badge."
    elif action == "reject":
        profile.verification_status = "rejected"
        profile.verification_notes = notes or "Document verification failed. Please contact support."
        msg = f"Your buyer verification was declined. Reason: {notes or 'Incomplete business documents'}"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    # Send Notification to buyer
    notif = Notification(
        user_id=profile.user_id,
        type="verification",
        title=f"Verification Update: {profile.verification_status.title()}",
        message=msg,
        reference_type="user",
        reference_id=profile.user_id
    )
    db.add(notif)
    db.commit()

    deps.log_audit(db, admin.id, "VERIFY_BUYER", "BuyerProfile", profile.id, f"Action: {action}, Notes: {notes}")
    return {"message": f"Buyer verification updated to {profile.verification_status}"}


@router.get("/disputes", response_model=List[DisputeResponse])
def get_all_disputes(
    status_filter: Optional[str] = None,
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Dispute)
    if status_filter:
        query = query.filter(Dispute.status == status_filter)
    return query.order_by(Dispute.created_at.desc()).all()


@router.post("/disputes/{id}/resolve", response_model=DisputeResponse)
def resolve_dispute(
    id: int,
    data: DisputeResolve,
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    dispute = db.query(Dispute).filter(Dispute.id == id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    dispute.status = data.status
    dispute.resolution_notes = data.resolution_notes
    dispute.resolved_by_id = admin.id
    dispute.resolved_at = datetime.utcnow()

    # If resolved, update order status to resolved or completed
    if data.status == "resolved":
        dispute.order.status = "completed"

    # Notify both parties
    notif1 = Notification(
        user_id=dispute.raised_by_id,
        type="dispute_resolved",
        title=f"Dispute Resolved: #{dispute.id}",
        message=f"Admin resolved dispute: {data.resolution_notes}",
        reference_type="order",
        reference_id=dispute.order_id
    )
    notif2 = Notification(
        user_id=dispute.against_user_id,
        type="dispute_resolved",
        title=f"Dispute Resolved: #{dispute.id}",
        message=f"Admin resolved dispute: {data.resolution_notes}",
        reference_type="order",
        reference_id=dispute.order_id
    )
    db.add_all([notif1, notif2])
    db.commit()
    db.refresh(dispute)

    deps.log_audit(db, admin.id, "RESOLVE_DISPUTE", "Dispute", dispute.id, data.resolution_notes)
    return dispute


@router.get("/reports/summary")
def get_reports_summary(
    admin: User = Depends(deps.get_current_admin),
    db: Session = Depends(deps.get_db)
):
    # Category distribution
    categories_breakdown = db.query(
        CropCategory.name,
        func.count(ProduceListing.id).label("total_listings"),
        func.coalesce(func.sum(ProduceListing.total_quantity), 0).label("total_quantity")
    ).outerjoin(ProduceListing, ProduceListing.category_id == CropCategory.id).group_by(CropCategory.id).all()

    # Order status distribution
    order_statuses = db.query(
        Order.status,
        func.count(Order.id).label("count")
    ).group_by(Order.status).all()

    return {
        "categories_breakdown": [
            {"category": name, "listings": count, "quantity": qty}
            for name, count, qty in categories_breakdown
        ],
        "order_status_distribution": [
            {"status": status_name, "count": count}
            for status_name, count in order_statuses
        ]
    }
