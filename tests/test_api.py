import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app as fastapi_app
from app.database.session import SessionLocal, Base, engine
from app.services.seed_data import seed_database
from app.models.produce import ProduceListing
from app.models.order import Order

client = TestClient(fastapi_app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

def test_health_and_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_login_farmer():
    res = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543210",
        "password": "Farmer@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "farmer"
    assert data["full_name"] == "Rami Reddy"

def test_login_buyer():
    res = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543220",
        "password": "Buyer@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "buyer"

def test_login_admin():
    res = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543200",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"

def test_public_produce_excludes_min_acceptable_price():
    # Buyers and public should NEVER see min_acceptable_price
    res = client.get("/api/v1/buyer/produce")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) > 0
    for item in data["items"]:
        assert "min_acceptable_price" not in item, "SECURITY BREACH: min_acceptable_price exposed in public produce response!"

def test_farmer_produce_includes_min_acceptable_price():
    # Login as farmer
    login_res = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543210",
        "password": "Farmer@123"
    })
    token = login_res.json()["access_token"]

    # Farmer's own listings should include min_acceptable_price
    res = client.get(
        "/api/v1/farmer/produce",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    assert "min_acceptable_price" in items[0]

def test_offer_and_inventory_locking_prevent_overselling():
    # 1. Login as buyer
    buyer_login = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543221", # Priya Sharma (Buyer)
        "password": "Buyer@123"
    })
    buyer_token = buyer_login.json()["access_token"]

    # 2. Get a produce listing
    db = SessionLocal()
    listing = db.query(ProduceListing).filter(ProduceListing.crop_name.ilike("%Mangoes%")).first()
    avail_qty = listing.available_quantity
    produce_id = listing.id
    db.close()

    # 3. Attempt to submit offer exceeding available quantity
    excess_res = client.post(
        "/api/v1/buyer/offers",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "produce_id": produce_id,
            "requested_quantity": avail_qty + 1000,
            "offered_price_per_unit": 70.0,
            "preferred_delivery_date": "2026-11-25",
            "delivery_method": "Farmer Delivery"
        }
    )
    assert excess_res.status_code == 400
    assert "exceeds" in excess_res.json()["detail"].lower()

    # 4. Submit valid partial offer
    valid_res = client.post(
        "/api/v1/buyer/offers",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "produce_id": produce_id,
            "requested_quantity": 500,
            "offered_price_per_unit": 72.0,
            "preferred_delivery_date": "2026-11-25",
            "delivery_method": "Farmer Delivery"
        }
    )
    assert valid_res.status_code == 201
    offer_id = valid_res.json()["id"]

    # 5. Login as farmer who owns this produce
    farmer_login = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543210", # Rami Reddy
        "password": "Farmer@123"
    })
    farmer_token = farmer_login.json()["access_token"]

    # 6. Farmer accepts the offer
    accept_res = client.post(
        f"/api/v1/farmer/offers/{offer_id}/accept",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    assert accept_data["remaining_stock"] == avail_qty - 500
    order_id = accept_data["order_id"]

    # 7. Check that Order was created
    order_res = client.get(
        f"/api/v1/orders/{order_id}",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert order_res.status_code == 200
    assert order_res.json()["status"] == "order_confirmed"

def test_weighment_calculation_and_confirmation():
    # Login buyer
    buyer_login = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543220",
        "password": "Buyer@123"
    })
    buyer_token = buyer_login.json()["access_token"]

    # Get buyer order
    orders_res = client.get(
        "/api/v1/buyer/orders",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    orders = orders_res.json()
    assert len(orders) > 0
    test_order = orders[0]
    order_id = test_order["id"]

    # Buyer records weighment: Gross 5020, Packaging 20 -> Net 5000. Accepted 4950, Rejected 50.
    weigh_res = client.post(
        f"/api/v1/buyer/orders/{order_id}/record-weighment",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "gross_weight": 5020.0,
            "packaging_weight": 20.0,
            "accepted_quantity": 4950.0,
            "rejected_quantity": 50.0,
            "rejection_reason": "Chaff / moisture deduction",
            "scale_type": "APMC Mandi Weighbridge"
        }
    )
    assert weigh_res.status_code == 200
    weigh_data = weigh_res.json()
    assert weigh_data["net_weight"] == 5000.0
    assert weigh_data["accepted_quantity"] == 4950.0
    expected_amount = round(4950.0 * test_order["agreed_price_per_unit"], 2)
    assert weigh_data["calculated_final_amount"] == expected_amount

def test_mock_payment_with_demo_label():
    buyer_login = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543220",
        "password": "Buyer@123"
    })
    buyer_token = buyer_login.json()["access_token"]

    orders_res = client.get(
        "/api/v1/buyer/orders",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    order_id = orders_res.json()[0]["id"]

    pay_res = client.post(
        "/api/v1/payments/process",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "order_id": order_id,
            "amount": 5000.0,
            "payment_stage": "advance",
            "payment_method": "upi",
            "notes": "Testing advance settlement"
        }
    )
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["is_demo"] is True
    assert "DEMO" in pay_data["demo_badge_text"]
    assert "receipt_number" in pay_data

def test_admin_dashboard_and_verification():
    admin_login = client.post("/api/v1/auth/login", json={
        "mobile_or_email": "9876543200",
        "password": "Admin@123"
    })
    admin_token = admin_login.json()["access_token"]

    dash_res = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert dash_res.status_code == 200
    metrics = dash_res.json()["metrics"]
    assert metrics["total_farmers"] >= 5
    assert metrics["total_buyers"] >= 5
    assert metrics["active_listings"] >= 10
