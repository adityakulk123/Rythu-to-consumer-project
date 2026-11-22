from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User, FarmerProfile, BuyerProfile
from app.schemas.auth import (
    FarmerRegister,
    BuyerRegister,
    UserLogin,
    Token,
    UserResponse
)

router = APIRouter()

@router.post("/register/farmer", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_farmer(data: FarmerRegister, db: Session = Depends(deps.get_db)):
    # Check if mobile exists
    existing_user = db.query(User).filter(User.mobile_number == data.mobile_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Mobile number is already registered")

    if data.email:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        full_name=data.full_name,
        mobile_number=data.mobile_number,
        email=data.email,
        password_hash=security.get_password_hash(data.password),
        role="farmer",
        village=data.village,
        district=data.district,
        state=data.state,
        pincode=data.pincode,
        is_active=True
    )
    db.add(user)
    db.flush()

    farmer_profile = FarmerProfile(
        user_id=user.id,
        farm_name=data.farm_name,
        farm_location=data.farm_location,
        crops_cultivated=data.crops_cultivated,
        farm_size_acres=data.farm_size_acres,
        experience_years=data.experience_years,
        organic_certified=data.organic_certified
    )
    db.add(farmer_profile)
    db.commit()
    db.refresh(user)

    deps.log_audit(db, user.id, "FARMER_REGISTRATION", "User", user.id, f"Farmer registered: {user.full_name}")

    access_token = security.create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        mobile_number=user.mobile_number
    )


@router.post("/register/buyer", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_buyer(data: BuyerRegister, db: Session = Depends(deps.get_db)):
    # Check if mobile exists
    existing_user = db.query(User).filter(User.mobile_number == data.mobile_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Mobile number is already registered")

    if data.email:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        full_name=data.full_name,
        mobile_number=data.mobile_number,
        email=data.email,
        password_hash=security.get_password_hash(data.password),
        role="buyer",
        village=data.village,
        district=data.district,
        state=data.state,
        pincode=data.pincode,
        is_active=True
    )
    db.add(user)
    db.flush()

    buyer_profile = BuyerProfile(
        user_id=user.id,
        business_name=data.business_name,
        business_type=data.business_type,
        business_address=data.business_address,
        buyer_category=data.buyer_category,
        gstin_pan=data.gstin_pan,
        verification_status="verified" if "Demo" in data.business_name or "Verified" in data.business_name else "pending"
    )
    db.add(buyer_profile)
    db.commit()
    db.refresh(user)

    deps.log_audit(db, user.id, "BUYER_REGISTRATION", "User", user.id, f"Buyer registered: {user.full_name}")

    access_token = security.create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        mobile_number=user.mobile_number
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(deps.get_db)):
    user = db.query(User).filter(
        (User.mobile_number == data.mobile_or_email) | (User.email == data.mobile_or_email)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect mobile number, email, or password")

    if not security.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect mobile number, email, or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="This account has been deactivated or suspended")

    deps.log_audit(db, user.id, "USER_LOGIN", "User", user.id, f"User logged in: {user.mobile_number}")

    access_token = security.create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        mobile_number=user.mobile_number
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    return current_user
