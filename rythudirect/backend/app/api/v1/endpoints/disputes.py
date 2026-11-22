from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.dispute import DisputeCreate, DisputeResponse
from app.services.dispute_service import create_dispute, get_disputes

router = APIRouter()

@router.post("", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def raise_dispute(data: DisputeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Report a dispute regarding weight, quality deductions, or payments."""
    return create_dispute(db, current_user, data)

@router.get("", response_model=List[DisputeResponse])
def get_my_disputes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List disputes raised by or involving the current user."""
    return get_disputes(db, current_user)
