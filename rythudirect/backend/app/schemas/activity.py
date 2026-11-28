from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ActivityTrackRequest(BaseModel):
    activity_type: str = Field(default="PAGE_VIEW", description="Type of user activity (PAGE_VIEW, FEATURE_INTERACTION, etc.)")
    page_path: str = Field(description="Relative path within the application (e.g. /store, /orders)")
    page_title: Optional[str] = None
    feature_name: Optional[str] = None
    details: Optional[str] = None
    session_id: Optional[str] = None

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_identifier: Optional[str] = None
    user_role: Optional[str] = None
    activity_type: str
    page_path: Optional[str] = None
    page_title: Optional[str] = None
    feature_name: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TopItem(BaseModel):
    name: str
    count: int

class ActivitySummaryResponse(BaseModel):
    total_events: int
    total_page_views: int
    total_feature_clicks: int
    successful_logins: int
    failed_logins: int
    unique_active_users: int
    top_pages: List[TopItem]
    top_features: List[TopItem]
    recent_suspicious_or_failed_attempts: List[ActivityLogResponse]
