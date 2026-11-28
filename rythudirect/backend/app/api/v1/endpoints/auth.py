import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
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
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Logs in with mobile number or email and returns a signed JWT."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    return authenticate_user(db, login_data, ip_address=client_ip, user_agent=user_agent)

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logs out the user and records logout activity with timestamp."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    from app.services.activity_service import log_activity
    log_activity(
        db=db,
        activity_type="LOGOUT",
        user_id=current_user.id,
        user_identifier=current_user.mobile_number or current_user.email,
        user_role=current_user.role,
        page_path="/logout",
        page_title="User Logout",
        feature_name="SignOut",
        details="User logged out successfully",
        ip_address=client_ip,
        user_agent=user_agent
    )
    return {
        "message": "User logged out successfully",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

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
