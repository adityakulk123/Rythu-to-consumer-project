from fastapi import APIRouter
from app.api.v1 import (
    auth,
    farmer,
    buyer,
    orders,
    payments,
    market_prices,
    disputes,
    notifications,
    admin
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
api_router.include_router(buyer.router, prefix="/buyer", tags=["Buyer & Marketplace"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(market_prices.router, prefix="/market-prices", tags=["Market Prices (Mandi Bhav)"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["Disputes"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
