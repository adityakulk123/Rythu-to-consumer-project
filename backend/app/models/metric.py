import datetime
from sqlalchemy import Column, Integer, Float, BigInteger, DateTime
from app.core.database import Base

class Metric(Base):
    """
    Automated server metrics collection table.
    Stores lightweight hardware utilization and uptime statistics every 3 hours.
    """
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    cpu_percent = Column(Float, nullable=False, comment="CPU usage percentage")
    ram_percent = Column(Float, nullable=False, comment="RAM usage percentage")
    ram_total = Column(BigInteger, nullable=False, comment="Total physical RAM in bytes")
    ram_used = Column(BigInteger, nullable=False, comment="Used physical RAM in bytes")
    disk_percent = Column(Float, nullable=False, comment="Disk utilization percentage")
    disk_total = Column(BigInteger, nullable=False, comment="Total disk space in bytes")
    disk_used = Column(BigInteger, nullable=False, comment="Used disk space in bytes")
    network_bytes_sent = Column(BigInteger, nullable=False, comment="Total network bytes transmitted")
    network_bytes_recv = Column(BigInteger, nullable=False, comment="Total network bytes received")
    server_uptime_seconds = Column(Float, nullable=False, comment="Server system uptime in seconds")
    collected_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True, comment="Collection timestamp UTC")
