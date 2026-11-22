from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.order import Order, WeighmentRecord, QualityAssessment
from app.schemas.order import OrderResponse

router = APIRouter()

@router.get("/{id}", response_model=dict)
def get_order_detail(
    id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Access control: Farmer, Buyer, or Admin
    if current_user.role != "admin" and order.farmer_id != current_user.id and order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this order")

    # Serialize order with details
    order_data = OrderResponse.model_validate(order).model_dump()
    order_data["produce"] = {
        "id": order.produce.id,
        "crop_name": order.produce.crop_name,
        "variety": order.produce.variety,
        "unit": order.produce.unit,
        "quality_grade": order.produce.quality_grade,
        "village": order.produce.village,
        "district": order.produce.district,
        "state": order.produce.state,
    }
    order_data["farmer"] = {
        "id": order.farmer.id,
        "full_name": order.farmer.full_name,
        "mobile_number": order.farmer.mobile_number,
        "farm_name": order.farmer.farmer_profile.farm_name if order.farmer.farmer_profile else "",
        "village": order.farmer.village,
        "district": order.farmer.district,
    }
    order_data["buyer"] = {
        "id": order.buyer.id,
        "full_name": order.buyer.full_name,
        "mobile_number": order.buyer.mobile_number,
        "business_name": order.buyer.buyer_profile.business_name if order.buyer.buyer_profile else "",
        "business_type": order.buyer.buyer_profile.business_type if order.buyer.buyer_profile else "",
        "verification_status": order.buyer.buyer_profile.verification_status if order.buyer.buyer_profile else "pending",
    }
    order_data["transactions"] = [
        {
            "id": tx.id,
            "amount": tx.amount,
            "payment_stage": tx.payment_stage,
            "payment_method": tx.payment_method,
            "transaction_reference": tx.transaction_reference,
            "receipt_number": tx.receipt_number,
            "is_demo": tx.is_demo,
            "status": tx.status,
            "created_at": tx.created_at.isoformat()
        }
        for tx in order.payment_transactions
    ]

    return order_data
