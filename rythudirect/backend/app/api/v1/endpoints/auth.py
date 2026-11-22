from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, LoginRequest, TokenResponse, UserResponse, UserUpdate
from app.services.auth_service import register_user, authenticate_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(reg_data: UserRegister, db: Session = Depends(get_db)):
    """Registers a new Farmer or Buyer (ordinary users cannot register as Admin)."""
    user = register_user(db, reg_data)
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Logs in with mobile number or email and returns a signed JWT."""
    return authenticate_user(db, login_data)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates profile information."""
    for field, val in update_data.model_dump(exclude_unset=True).items():
        if field in ["farmer_details", "buyer_details"]:
            continue
        if hasattr(current_user, field) and val is not None:
            setattr(current_user, field, val)

    if update_data.farmer_details and current_user.farmer_profile:
        for f, v in update_data.farmer_details.model_dump(exclude_unset=True).items():
            if v is not None:
                setattr(current_user.farmer_profile, f, v)

    if update_data.buyer_details and current_user.buyer_profile:
        for f, v in update_data.buyer_details.model_dump(exclude_unset=True).items():
            if v is not None:
                setattr(current_user.buyer_profile, f, v)

    db.commit()
    db.refresh(current_user)
    return current_user
