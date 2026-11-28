import os
import time
import asyncio
import logging
import datetime
from typing import Optional, Dict, Any
import psutil
from app.core.database import SessionLocal
from app.models.metric import Metric

logger = logging.getLogger("rythudirect.metrics")

# Configured interval: 3 hours (180 minutes = 10,800 seconds)
# Strictly adheres to requirement of collecting only once every 3 hours to conserve database storage.
METRICS_INTERVAL_SECONDS: int = 3 * 60 * 60

# Module-level singleton state to prevent duplicate scheduler instances
_scheduler_task: Optional[asyncio.Task] = None
_stop_event: Optional[asyncio.Event] = None
_lock: asyncio.Lock = asyncio.Lock()


def collect_server_metrics() -> Dict[str, Any]:
    """
    Collects basic host server metrics:
    - CPU usage percentage
    - RAM usage percentage, total, used
    - Disk usage percentage, total, used
    - Network bytes sent and received
    - Server uptime
    - Collection timestamp
    Handles collection failures gracefully.
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
    except Exception as e:
        logger.warning(f"Error reading CPU percentage: {e}")
        cpu_percent = 0.0

    try:
        vm = psutil.virtual_memory()
        ram_percent = float(vm.percent)
        ram_total = int(vm.total)
        ram_used = int(vm.used)
    except Exception as e:
        logger.warning(f"Error reading RAM metrics: {e}")
        ram_percent, ram_total, ram_used = 0.0, 0, 0

    try:
        root_dir = os.path.abspath(os.sep)
        disk = psutil.disk_usage(root_dir)
        disk_percent = float(disk.percent)
        disk_total = int(disk.total)
        disk_used = int(disk.used)
    except Exception as e:
        logger.warning(f"Error reading Disk metrics: {e}")
        disk_percent, disk_total, disk_used = 0.0, 0, 0

    try:
        net = psutil.net_io_counters()
        net_sent = int(net.bytes_sent)
        net_recv = int(net.bytes_recv)
    except Exception as e:
        logger.warning(f"Error reading Network counters: {e}")
        net_sent, net_recv = 0, 0

    try:
        boot_time = psutil.boot_time()
        uptime_seconds = round(time.time() - boot_time, 2)
    except Exception as e:
        logger.warning(f"Error reading server uptime: {e}")
        uptime_seconds = 0.0

    return {
        "cpu_percent": cpu_percent,
        "ram_percent": ram_percent,
        "ram_total": ram_total,
        "ram_used": ram_used,
        "disk_percent": disk_percent,
        "disk_total": disk_total,
        "disk_used": disk_used,
        "network_bytes_sent": net_sent,
        "network_bytes_recv": net_recv,
        "server_uptime_seconds": uptime_seconds,
        "collected_at": datetime.datetime.utcnow(),
    }


def record_metrics_to_db() -> Optional[Metric]:
    """
    Collects server metrics and stores them into the Supabase PostgreSQL `metrics` table.
    Catches and logs any database error without disrupting main application behavior.
    """
    metrics_data = collect_server_metrics()
    db = SessionLocal()
    try:
        metric_record = Metric(
            cpu_percent=metrics_data["cpu_percent"],
            ram_percent=metrics_data["ram_percent"],
            ram_total=metrics_data["ram_total"],
            ram_used=metrics_data["ram_used"],
            disk_percent=metrics_data["disk_percent"],
            disk_total=metrics_data["disk_total"],
            disk_used=metrics_data["disk_used"],
            network_bytes_sent=metrics_data["network_bytes_sent"],
            network_bytes_recv=metrics_data["network_bytes_recv"],
            server_uptime_seconds=metrics_data["server_uptime_seconds"],
            collected_at=metrics_data["collected_at"],
        )
        db.add(metric_record)
        db.commit()
        db.refresh(metric_record)
        logger.info(
            f"Server metrics stored successfully: ID={metric_record.id}, "
            f"CPU={metric_record.cpu_percent}%, RAM={metric_record.ram_percent}%, "
            f"Disk={metric_record.disk_percent}% at {metric_record.collected_at.isoformat()}"
        )
        return metric_record
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record server metrics to Supabase: {e}", exc_info=True)
        return None
    finally:
        db.close()


async def _scheduler_loop(stop_event: asyncio.Event) -> None:
    """
    Background worker loop that triggers metrics collection once every 3 hours (180 minutes).
    Executes an initial baseline capture on startup, then waits for the 3-hour interval.
    """
    logger.info(f"Automated server metrics scheduler started. Interval = {METRICS_INTERVAL_SECONDS}s (3 hours).")

    # Initial capture on backend startup
    try:
        record_metrics_to_db()
    except Exception as e:
        logger.error(f"Error during initial metrics capture: {e}")

    # Subsequent collections every 3 hours
    while not stop_event.is_set():
        try:
            # Wait for 3 hours (or early exit if stop_event is triggered during server shutdown)
            await asyncio.wait_for(stop_event.wait(), timeout=METRICS_INTERVAL_SECONDS)
            # If wait returned without timeout, stop_event was signaled
            break
        except asyncio.TimeoutError:
            # 3-hour timer elapsed -> collect next metrics snapshot
            try:
                record_metrics_to_db()
            except Exception as e:
                logger.error(f"Error during scheduled 3-hour metrics collection: {e}")


async def start_metrics_scheduler() -> None:
    """
    Starts the automated metrics collection scheduler as an asyncio background task.
    Prevents duplicate instances.
    """
    global _scheduler_task, _stop_event

    async with _lock:
        if _scheduler_task is not None and not _scheduler_task.done():
            logger.warning("Metrics scheduler task is already running. Skipping duplicate startup.")
            return

        _stop_event = asyncio.Event()
        _scheduler_task = asyncio.create_task(_scheduler_loop(_stop_event))
        logger.info("Metrics collection scheduler task successfully initialized.")


async def stop_metrics_scheduler() -> None:
    """
    Gracefully shuts down the background metrics scheduler task during server shutdown.
    """
    global _scheduler_task, _stop_event

    async with _lock:
        if _stop_event is not None:
            _stop_event.set()

        if _scheduler_task is not None and not _scheduler_task.done():
            try:
                # Wait briefly for graceful loop exit
                await asyncio.wait_for(_scheduler_task, timeout=5.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                _scheduler_task.cancel()
            logger.info("Metrics collection scheduler task shut down gracefully.")
            _scheduler_task = None
