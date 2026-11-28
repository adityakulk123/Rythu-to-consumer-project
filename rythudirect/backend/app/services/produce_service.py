from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException, status

from app.models.produce import ProduceListing, ProduceImage, CropCategory
from app.models.user import User, UserRole
from app.schemas.produce import ProduceCreate, ProduceUpdate, ProduceResponse, ProduceListFilter, FarmerBasicInfo, ProduceImageResponse

def _format_produce_response(produce: ProduceListing, current_user: Optional[User] = None) -> ProduceResponse:
    # Strict privacy requirement:
    # Never expose min_acceptable_price to buyers or public!
    is_authorized_viewer = (
        current_user is not None and 
        (current_user.id == produce.farmer_id or current_user.role == UserRole.ADMIN)
    )
    
    farmer_info = None
    if produce.farmer:
        farm_name = None
        if produce.farmer.farmer_profile:
            farm_name = produce.farmer.farmer_profile.farm_name
        farmer_info = FarmerBasicInfo(
            id=produce.farmer.id,
            full_name=produce.farmer.full_name,
            village=produce.farmer.village,
            district=produce.farmer.district,
            state=produce.farmer.state,
            farm_name=farm_name
        )

    images = [
        ProduceImageResponse(
            id=img.id,
            image_url=img.image_url,
            is_primary=bool(getattr(img, 'is_primary', False))
        ) for img in produce.images
    ]

    return ProduceResponse(
        id=produce.id,
        farmer_id=produce.farmer_id,
        category_id=produce.category_id,
        crop_name=produce.crop_name,
        quantity=produce.quantity,
        unit=produce.unit,
        remaining_quantity=produce.remaining_quantity,
        expected_price_per_kg=produce.expected_price_per_kg,
        min_acceptable_price=produce.min_acceptable_price if is_authorized_viewer else None,
        harvest_date=produce.harvest_date,
        available_until=produce.available_until,
        quality_grade=produce.quality_grade,
        description=produce.description,
        village=produce.village,
        delivery_location=produce.delivery_location,
        delivery_available=produce.delivery_available,
        pickup_available=produce.pickup_available,
        status=produce.status,
        created_at=produce.created_at,
        images=images,
        farmer=farmer_info,
        category_name=produce.category.name if produce.category else None
    )

def create_produce_listing(db: Session, farmer: User, data: ProduceCreate) -> ProduceResponse:
    if farmer.role != UserRole.FARMER and farmer.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered farmers can create produce listings."
        )

    category = db.query(CropCategory).filter(CropCategory.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop category not found.")

    if data.min_acceptable_price > data.expected_price_per_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum acceptable price cannot be higher than the asking expected price."
        )

    listing = ProduceListing(
        farmer_id=farmer.id,
        category_id=data.category_id,
        crop_name=data.crop_name.strip(),
        quantity=data.quantity,
        unit=data.unit,
        remaining_quantity=data.quantity,
        expected_price_per_kg=data.expected_price_per_kg,
        min_acceptable_price=data.min_acceptable_price,
        harvest_date=data.harvest_date,
        available_until=data.available_until,
        quality_grade=data.quality_grade,
        description=data.description,
        village=data.village or farmer.village,
        delivery_location=data.delivery_location or f"{farmer.village}, {farmer.district}",
        delivery_available=data.delivery_available,
        pickup_available=data.pickup_available,
        status="ACTIVE"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Add images if provided
    for idx, url in enumerate(data.image_urls):
        img = ProduceImage(
            produce_id=listing.id,
            image_url=url,
            is_primary=(idx == 0)
        )
        db.add(img)
    db.commit()
    db.refresh(listing)

    return _format_produce_response(listing, farmer)

def get_produce_listing(db: Session, produce_id: int, current_user: Optional[User] = None) -> ProduceResponse:
    listing = db.query(ProduceListing).filter(ProduceListing.id == produce_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produce listing not found.")
    return _format_produce_response(listing, current_user)

def list_produce(
    db: Session,
    filter_params: ProduceListFilter,
    current_user: Optional[User] = None,
    farmer_id: Optional[int] = None
) -> dict:
    query = db.query(ProduceListing)

    if farmer_id:
        query = query.filter(ProduceListing.farmer_id == farmer_id)
    else:
        # For public buyers, only show active or partially sold listings
        query = query.filter(ProduceListing.status.in_(["ACTIVE", "PARTIALLY_SOLD"]))

    if filter_params.crop_name:
        query = query.filter(ProduceListing.crop_name.ilike(f"%{filter_params.crop_name.strip()}%"))

    if filter_params.category_id:
        query = query.filter(ProduceListing.category_id == filter_params.category_id)

    if filter_params.village:
        query = query.filter(ProduceListing.village.ilike(f"%{filter_params.village.strip()}%"))

    if filter_params.district:
        query = query.join(ProduceListing.farmer).filter(User.district.ilike(f"%{filter_params.district.strip()}%"))

    if filter_params.state:
        query = query.join(ProduceListing.farmer).filter(User.state.ilike(f"%{filter_params.state.strip()}%"))

    if filter_params.min_price is not None:
        query = query.filter(ProduceListing.expected_price_per_kg >= filter_params.min_price)

    if filter_params.max_price is not None:
        query = query.filter(ProduceListing.expected_price_per_kg <= filter_params.max_price)

    if filter_params.quality_grade:
        query = query.filter(ProduceListing.quality_grade == filter_params.quality_grade)

    # Sorting
    if filter_params.sort_by == "lowest_price":
        query = query.order_by(asc(ProduceListing.expected_price_per_kg))
    elif filter_params.sort_by == "highest_price":
        query = query.order_by(desc(ProduceListing.expected_price_per_kg))
    elif filter_params.sort_by == "highest_quantity":
        query = query.order_by(desc(ProduceListing.remaining_quantity))
    else:  # recently_listed default
        query = query.order_by(desc(ProduceListing.created_at))

    total = query.count()
    offset = (filter_params.page - 1) * filter_params.page_size
    items = query.offset(offset).limit(filter_params.page_size).all()

    return {
        "total": total,
        "page": filter_params.page,
        "page_size": filter_params.page_size,
        "total_pages": (total + filter_params.page_size - 1) // filter_params.page_size if filter_params.page_size > 0 else 1,
        "items": [_format_produce_response(item, current_user) for item in items]
    }

def update_produce_listing(db: Session, produce_id: int, farmer: User, data: ProduceUpdate) -> ProduceResponse:
    listing = db.query(ProduceListing).filter(ProduceListing.id == produce_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produce listing not found.")
    
    if listing.farmer_id != farmer.id and farmer.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this listing.")

    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "image_urls" and value is not None:
            db.query(ProduceImage).filter(ProduceImage.produce_id == listing.id).delete()
            for idx, url in enumerate(value):
                db.add(ProduceImage(produce_id=listing.id, image_url=url, is_primary=(idx == 0)))
        elif hasattr(listing, field):
            setattr(listing, field, value)

    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)
    return _format_produce_response(listing, farmer)

def delete_produce_listing(db: Session, produce_id: int, farmer: User) -> dict:
    listing = db.query(ProduceListing).filter(ProduceListing.id == produce_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produce listing not found.")
    
    if listing.farmer_id != farmer.id and farmer.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this listing.")

    # Check for active or completed orders referencing this produce item
    from app.models.order import Order
    from app.models.offer import BuyerOffer

    has_orders = db.query(Order).filter(Order.produce_id == produce_id).first() is not None
    if not has_orders:
        has_orders = db.query(BuyerOffer).filter(
            BuyerOffer.produce_id == produce_id,
            BuyerOffer.status.in_(["ACCEPTED", "CONFIRMED"])
        ).first() is not None

    if has_orders:
        # Preserve historical transaction data by archiving/deactivating
        listing.status = "ARCHIVED"
        listing.remaining_quantity = Decimal("0.0")
        listing.updated_at = datetime.utcnow()
        db.commit()
        return {
            "message": "Produce listing has associated orders and has been archived instead of permanently deleted to preserve transaction history.",
            "id": produce_id,
            "action": "archived"
        }
    else:
        # Safe to delete produce images, pending offers, and listing record
        db.query(ProduceImage).filter(ProduceImage.produce_id == listing.id).delete()
        db.query(BuyerOffer).filter(BuyerOffer.produce_id == listing.id).delete()
        db.delete(listing)
        db.commit()
        return {
            "message": "Produce listing deleted successfully.",
            "id": produce_id,
            "action": "deleted"
        }
