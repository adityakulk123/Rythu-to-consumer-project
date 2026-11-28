import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_identifier = Column(String(100), nullable=True, index=True)
    user_role = Column(String(30), nullable=True, index=True)
    activity_type = Column(String(60), nullable=False, index=True)  # PAGE_VIEW, FEATURE_INTERACTION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, REGISTER, SUSPICIOUS_ATTEMPT
    page_path = Column(String(255), nullable=True, index=True)
    page_title = Column(String(255), nullable=True)
    feature_name = Column(String(100), nullable=True, index=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(60), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", backref="activities")
