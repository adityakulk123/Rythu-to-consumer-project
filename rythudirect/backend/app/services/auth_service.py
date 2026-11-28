from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, FarmerProfile, BuyerProfile, BuyerVerification, UserRole
from app.schemas.user import UserRegister, LoginRequest, UserUpdate
from app.core.security import hash_password, verify_password, create_access_token

def register_user(db: Session, reg_data: UserRegister) -> User:
    # Rule 1: Never allow registration as ADMIN via public API
    if reg_data.role not in [UserRole.FARMER, UserRole.BUYER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is only permitted for FARMER or BUYER roles."
        )

    # Check mobile number uniqueness
    existing_user = db.query(User).filter(User.mobile_number == reg_data.mobile_number).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number is already registered."
        )

    # Check email uniqueness if provided
    if reg_data.email:
        existing_email = db.query(User).filter(User.email == reg_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered."
            )

    # Create User
    user = User(
        full_name=reg_data.full_name,
        mobile_number=reg_data.mobile_number,
        email=reg_data.email,
        hashed_password=hash_password(reg_data.password),
        role=reg_data.role,
        village=reg_data.village,
        district=reg_data.district,
        state=reg_data.state,
        pincode=reg_data.pincode,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Role specific profile
    if reg_data.role == UserRole.FARMER:
        farmer_extra = reg_data.farmer_details
        profile = FarmerProfile(
            user_id=user.id,
            farm_name=farmer_extra.farm_name if farmer_extra else None,
            farm_location=farmer_extra.farm_location if farmer_extra else None,
            cultivated_crops=farmer_extra.cultivated_crops if farmer_extra else None,
            farm_size_acres=farmer_extra.farm_size_acres if farmer_extra else None
        )
        db.add(profile)
        db.commit()

    elif reg_data.role == UserRole.BUYER:
        buyer_extra = reg_data.buyer_details
        if not buyer_extra:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Buyer profile details (business_name, business_type) are required."
            )
        is_consumer = (buyer_extra.buyer_category == "INDIVIDUAL_CONSUMER" or buyer_extra.business_type == "Consumer")
        profile = BuyerProfile(
            user_id=user.id,
            business_name=buyer_extra.business_name,
            business_type=buyer_extra.business_type,
            business_address=buyer_extra.business_address,
            buyer_category=buyer_extra.buyer_category,
            is_verified=True if is_consumer else False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Verification document if submitted
        if buyer_extra.document_type and buyer_extra.document_number:
            verification = BuyerVerification(
                buyer_id=profile.id,
                document_type=buyer_extra.document_type,
                document_number=buyer_extra.document_number,
                document_url=buyer_extra.document_url,
                status="PENDING"
            )
            db.add(verification)
            db.commit()

    db.refresh(user)

    from app.services.activity_service import log_activity
    log_activity(
        db=db,
        activity_type="REGISTER",
        user_id=user.id,
        user_identifier=user.mobile_number,
        user_role=user.role,
        page_path="/register",
        page_title="User Registration",
        feature_name="RegisterAccount",
        details=f"New user registered with role {user.role}"
    )

    return user

def authenticate_user(db: Session, login_data: LoginRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> dict:
    from app.services.activity_service import log_activity

    query = db.query(User).filter(
        (User.mobile_number == login_data.mobile_or_email) | (User.email == login_data.mobile_or_email)
    )
    user = query.first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        log_activity(
            db=db,
            activity_type="LOGIN_FAILED",
            user_identifier=login_data.mobile_or_email,
            page_path="/login",
            page_title="User Login",
            feature_name="Authenticate",
            details="Invalid mobile/email or password entered",
            ip_address=ip_address,
            user_agent=user_agent
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile/email or password."
        )

    if not user.is_active:
        log_activity(
            db=db,
            activity_type="LOGIN_FAILED",
            user_id=user.id,
            user_identifier=user.mobile_number or user.email,
            user_role=user.role,
            page_path="/login",
            page_title="User Login",
            feature_name="Authenticate",
            details="Attempted login on deactivated account",
            ip_address=ip_address,
            user_agent=user_agent
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )

    is_verified = True
    if user.role == UserRole.BUYER and user.buyer_profile:
        is_verified = user.buyer_profile.is_verified

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    log_activity(
        db=db,
        activity_type="LOGIN_SUCCESS",
        user_id=user.id,
        user_identifier=user.mobile_number or user.email,
        user_role=user.role,
        page_path="/login",
        page_title="User Login",
        feature_name="Authenticate",
        details="Successful login",
        ip_address=ip_address,
        user_agent=user_agent
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "is_verified": is_verified,
    }
