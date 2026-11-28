from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.metric import Metric
from app.services.metrics_service import METRICS_INTERVAL_SECONDS, collect_server_metrics

router = APIRouter()

@router.get("", status_code=status.HTTP_200_OK)
def list_metrics(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves collected server metrics from Supabase PostgreSQL.
    Restricted to authenticated Admin users only.
    Returns records sorted by collection timestamp in descending order (latest first).
    """
    total = db.query(Metric).count()
    records = (
        db.query(Metric)
        .order_by(desc(Metric.collected_at), desc(Metric.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": m.id,
                "cpu_percent": m.cpu_percent,
                "ram_percent": m.ram_percent,
                "ram_total": m.ram_total,
                "ram_used": m.ram_used,
                "disk_percent": m.disk_percent,
                "disk_total": m.disk_total,
                "disk_used": m.disk_used,
                "network_bytes_sent": m.network_bytes_sent,
                "network_bytes_recv": m.network_bytes_recv,
                "server_uptime_seconds": m.server_uptime_seconds,
                "collected_at": m.collected_at.isoformat(),
            }
            for m in records
        ]
    }

@router.get("/status", status_code=status.HTTP_200_OK)
def get_metrics_scheduler_status(db: Session = Depends(get_db)):
    """
    Returns the automated metrics scheduler configuration and status.
    Confirms the 3-hour (180 minutes) interval and total stored records.
    """
    total_records = db.query(Metric).count()
    latest_record = db.query(Metric).order_by(desc(Metric.id)).first()

    return {
        "status": "active",
        "interval_hours": 3,
        "interval_minutes": 180,
        "interval_seconds": METRICS_INTERVAL_SECONDS,
        "total_records_collected": total_records,
        "latest_collection_id": latest_record.id if latest_record else None,
        "latest_collected_at": latest_record.collected_at.isoformat() if latest_record else None,
    }

@router.get("/latest", status_code=status.HTTP_200_OK)
def get_latest_metrics(db: Session = Depends(get_db)):
    """
    Retrieves the most recently recorded server metrics snapshot from Supabase PostgreSQL.
    """
    latest = db.query(Metric).order_by(desc(Metric.id)).first()
    if not latest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No metrics records collected yet.")

    return {
        "id": latest.id,
        "cpu_percent": latest.cpu_percent,
        "ram_percent": latest.ram_percent,
        "ram_total_bytes": latest.ram_total,
        "ram_used_bytes": latest.ram_used,
        "disk_percent": latest.disk_percent,
        "disk_total_bytes": latest.disk_total,
        "disk_used_bytes": latest.disk_used,
        "network_bytes_sent": latest.network_bytes_sent,
        "network_bytes_received": latest.network_bytes_recv,
        "server_uptime_seconds": latest.server_uptime_seconds,
        "collected_at": latest.collected_at.isoformat(),
    }
