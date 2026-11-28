import re
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.activity import UserActivityLog
from app.models.user import User

def sanitize_path(path: Optional[str]) -> str:
    """Ensures paths are strictly internal relative paths to protect user privacy."""
    if not path:
        return "/"
    # Strip any http/https domain if mistakenly sent
    match = re.search(r"https?://[^/]+(/.*)", path)
    if match:
        clean = match.group(1)
    else:
        clean = path if path.startswith("/") else f"/{path}"
    # Truncate at query param or hash for privacy if needed, or keep clean path
    return clean[:250]

def sanitize_details(details: Optional[str]) -> Optional[str]:
    """Ensures sensitive tokens, passwords, or secrets are never logged in activity details."""
    if not details:
        return None
    # Mask common sensitive keys
    sanitized = re.sub(r'("?(?:password|token|secret|access_token|authorization|auth_token)"?\s*[:=]\s*"?)[^",\s}]+("?)', r'\1***REDACTED***\2', details, flags=re.IGNORECASE)
    return sanitized[:1000]

def log_activity(
    db: Session,
    activity_type: str,
    user_id: Optional[int] = None,
    user_identifier: Optional[str] = None,
    user_role: Optional[str] = None,
    page_path: Optional[str] = None,
    page_title: Optional[str] = None,
    feature_name: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> UserActivityLog:
    """
    Persists a sanitized user activity event to the database.
    Privacy guarantees:
    - Intra-site tracking only (paths sanitized to relative paths)
    - Sensitive credentials and tokens are strictly redacted
    """
    clean_path = sanitize_path(page_path)
    clean_details = sanitize_details(details)
    clean_ua = (user_agent[:250] if user_agent else None)
    clean_ip = (ip_address[:55] if ip_address else None)

    activity = UserActivityLog(
        user_id=user_id,
        user_identifier=user_identifier,
        user_role=user_role,
        activity_type=activity_type.upper(),
        page_path=clean_path,
        page_title=(page_title[:250] if page_title else None),
        feature_name=(feature_name[:95] if feature_name else None),
        details=clean_details,
        ip_address=clean_ip,
        user_agent=clean_ua,
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

def get_activity_summary(db: Session) -> Dict[str, Any]:
    """Aggregates metrics for the admin monitoring dashboard."""
    total_events = db.query(func.count(UserActivityLog.id)).scalar() or 0
    total_page_views = db.query(func.count(UserActivityLog.id)).filter(UserActivityLog.activity_type == "PAGE_VIEW").scalar() or 0
    total_feature_clicks = db.query(func.count(UserActivityLog.id)).filter(UserActivityLog.activity_type == "FEATURE_INTERACTION").scalar() or 0
    successful_logins = db.query(func.count(UserActivityLog.id)).filter(UserActivityLog.activity_type == "LOGIN_SUCCESS").scalar() or 0
    failed_logins = db.query(func.count(UserActivityLog.id)).filter(UserActivityLog.activity_type == "LOGIN_FAILED").scalar() or 0
    
    unique_active_users = db.query(func.count(func.distinct(UserActivityLog.user_id))).filter(UserActivityLog.user_id.isnot(None)).scalar() or 0

    # Top 10 most visited pages
    top_pages_query = (
        db.query(UserActivityLog.page_path, func.count(UserActivityLog.id).label("count"))
        .filter(UserActivityLog.activity_type == "PAGE_VIEW", UserActivityLog.page_path.isnot(None))
        .group_by(UserActivityLog.page_path)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )
    top_pages = [{"name": p[0], "count": p[1]} for p in top_pages_query]

    # Top 10 feature interactions
    top_features_query = (
        db.query(UserActivityLog.feature_name, func.count(UserActivityLog.id).label("count"))
        .filter(UserActivityLog.activity_type == "FEATURE_INTERACTION", UserActivityLog.feature_name.isnot(None))
        .group_by(UserActivityLog.feature_name)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )
    top_features = [{"name": f[0], "count": f[1]} for f in top_features_query]

    # Recent suspicious activity or failed logins (last 20)
    suspicious_logs = (
        db.query(UserActivityLog)
        .filter(UserActivityLog.activity_type.in_(["LOGIN_FAILED", "SUSPICIOUS_ATTEMPT"]))
        .order_by(desc(UserActivityLog.created_at))
        .limit(20)
        .all()
    )

    return {
        "total_events": total_events,
        "total_page_views": total_page_views,
        "total_feature_clicks": total_feature_clicks,
        "successful_logins": successful_logins,
        "failed_logins": failed_logins,
        "unique_active_users": unique_active_users,
        "top_pages": top_pages,
        "top_features": top_features,
        "recent_suspicious_or_failed_attempts": suspicious_logs
    }

def get_activity_logs(
    db: Session,
    activity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
) -> List[UserActivityLog]:
    """Retrieve raw filtered activity logs for administrators."""
    query = db.query(UserActivityLog)
    if activity_type:
        query = query.filter(UserActivityLog.activity_type == activity_type.upper())
    if user_id:
        query = query.filter(UserActivityLog.user_id == user_id)
    return query.order_by(desc(UserActivityLog.created_at)).offset(offset).limit(limit).all()
