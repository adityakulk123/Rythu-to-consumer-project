from typing import Optional, List
from fastapi import APIRouter, Depends, Request, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin, get_optional_user
from app.models.user import User
from app.schemas.activity import ActivityTrackRequest, ActivityLogResponse, ActivitySummaryResponse
from app.services.activity_service import log_activity, get_activity_summary, get_activity_logs

router = APIRouter()

@router.post("/track", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
def track_user_event(
    event: ActivityTrackRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Record user browsing activity and feature interactions within the platform.
    Automatically captures authenticated user ID, role, client IP, and User-Agent.
    Strictly restricted to intra-site paths with credential redaction.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    user_id = current_user.id if current_user else None
    user_role = current_user.role if current_user else "GUEST"
    user_identifier = current_user.mobile_number or current_user.email if current_user else (event.session_id or "ANONYMOUS_SESSION")

    record = log_activity(
        db=db,
        activity_type=event.activity_type,
        user_id=user_id,
        user_identifier=user_identifier,
        user_role=user_role,
        page_path=event.page_path,
        page_title=event.page_title,
        feature_name=event.feature_name,
        details=event.details,
        ip_address=client_ip,
        user_agent=user_agent
    )
    return record

@router.get("/summary", response_model=ActivitySummaryResponse)
def get_analytics_summary(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Administrative overview of user activity, navigation trends, 
    frequently visited pages, feature interactions, and failed logins.
    """
    return get_activity_summary(db)

@router.get("/logs", response_model=List[ActivityLogResponse])
def get_detailed_logs(
    activity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Detailed audit log of user activity for system administrators.
    """
    return get_activity_logs(
        db=db,
        activity_type=activity_type,
        user_id=user_id,
        limit=limit,
        offset=offset
    )
