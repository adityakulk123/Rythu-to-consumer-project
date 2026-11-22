from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem
from app.models.user import User, UserRole
from app.schemas.order import OrderResponse, OrderItemResponse

def _format_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=item.id,
            crop_name=item.crop_name,
            quantity=item.quantity,
            price_per_kg=item.price_per_kg,
            total_price=item.total_price
        ) for item in order.items
    ]

    has_weighment = order.weighment_record is not None
    payment_status = order.payment_transaction.payment_status if order.payment_transaction else None

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        produce_id=order.produce_id,
        farmer_id=order.farmer_id,
        farmer_name=order.farmer.full_name if order.farmer else None,
        farmer_village=order.farmer.village if order.farmer else None,
        farmer_mobile=order.farmer.mobile_number if order.farmer else None,
        buyer_id=order.buyer_id,
        buyer_name=order.buyer.full_name if order.buyer else None,
        buyer_business_name=order.buyer.buyer_profile.business_name if (order.buyer and order.buyer.buyer_profile) else None,
        buyer_mobile=order.buyer.mobile_number if order.buyer else None,
        crop_name=order.produce.crop_name if order.produce else (items[0].crop_name if items else "Produce"),
        agreed_quantity=order.agreed_quantity,
        agreed_price_per_kg=order.agreed_price_per_kg,
        total_estimated_amount=order.total_estimated_amount,
        status=order.status,
        delivery_method=order.delivery_method,
        delivery_address=order.delivery_address,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        has_weighment=has_weighment,
        payment_status=payment_status
    )

def get_order_by_id(db: Session, order_id: int, current_user: User) -> OrderResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if current_user.role != UserRole.ADMIN and current_user.id != order.farmer_id and current_user.id != order.buyer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this order.")

    return _format_order_response(order)

def get_orders_for_user(db: Session, user: User) -> List[OrderResponse]:
    if user.role == UserRole.FARMER:
        orders = db.query(Order).filter(Order.farmer_id == user.id).order_by(Order.created_at.desc()).all()
    elif user.role == UserRole.BUYER:
        orders = db.query(Order).filter(Order.buyer_id == user.id).order_by(Order.created_at.desc()).all()
    else:  # Admin
        orders = db.query(Order).order_by(Order.created_at.desc()).all()

    return [_format_order_response(ord) for ord in orders]

def update_order_delivery_status(db: Session, order_id: int, user: User, new_status: str) -> OrderResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if user.id != order.farmer_id and user.id != order.buyer_id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this order.")

    valid_statuses = ["CONFIRMED", "WEIGHMENT_PENDING", "WEIGHMENT_COMPLETED", "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid order status: {new_status}")

    order.status = new_status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return _format_order_response(order)
