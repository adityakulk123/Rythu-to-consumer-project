import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.utils.seed_data import seed_database
from app.models.user import User, UserRole
from app.models.produce import ProduceListing, CropCategory
from app.models.offer import BuyerOffer
from app.models.order import Order

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

def test_prevent_admin_public_registration():
    with TestClient(app) as client:
        payload = {
            "full_name": "Attacker",
            "mobile_number": "9111111111",
            "password": "password123",
            "role": "ADMIN",
            "village": "Test Village"
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code in [400, 422]

def test_farmer_and_buyer_auth_flow():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:6]
        f_mobile = f"98{uuid.uuid4().int % 100000000:08d}"
        b_mobile = f"97{uuid.uuid4().int % 100000000:08d}"

        # 1. Register Farmer
        farmer_payload = {
            "full_name": f"Farmer Ramesh {unique_suffix}",
            "mobile_number": f_mobile,
            "email": f"ramesh_{unique_suffix}@example.com",
            "password": "securepassword",
            "role": "FARMER",
            "village": "Kotapally",
            "district": "Mancherial",
            "state": "Telangana",
            "pincode": "504208",
            "farmer_details": {
                "farm_name": "Ramesh Fields",
                "farm_location": "Survey 81",
                "cultivated_crops": "Paddy, Cotton",
                "farm_size_acres": 8.0
            }
        }
        res_f = client.post("/api/v1/auth/register", json=farmer_payload)
        assert res_f.status_code == 201
        farmer_data = res_f.json()
        assert farmer_data["role"] == "FARMER"

        # 2. Login Farmer
        login_f = client.post("/api/v1/auth/login", json={
            "mobile_or_email": f_mobile,
            "password": "securepassword"
        })
        assert login_f.status_code == 200
        farmer_token = login_f.json()["access_token"]
        assert farmer_token is not None

        # 3. Register Buyer
        buyer_payload = {
            "full_name": f"Buyer Suresh {unique_suffix}",
            "mobile_number": b_mobile,
            "email": f"suresh_{unique_suffix}@example.com",
            "password": "securepassword",
            "role": "BUYER",
            "village": "Kukatpally",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500072",
            "buyer_details": {
                "business_name": "Suresh Fresh Mart",
                "business_type": "Wholesaler",
                "business_address": "Shop 4, Market Yard",
                "buyer_category": "B2B",
                "document_type": "GSTIN",
                "document_number": f"36TEST{unique_suffix.upper()}"
            }
        }
        res_b = client.post("/api/v1/auth/register", json=buyer_payload)
        assert res_b.status_code == 201

        login_b = client.post("/api/v1/auth/login", json={
            "mobile_or_email": b_mobile,
            "password": "securepassword"
        })
        assert login_b.status_code == 200
        buyer_token = login_b.json()["access_token"]

        # 4. Farmer Creates Produce Listing
        headers_f = {"Authorization": f"Bearer {farmer_token}"}
        headers_b = {"Authorization": f"Bearer {buyer_token}"}

        produce_payload = {
            "crop_name": "Fresh Test Tomato",
            "category_id": 1,
            "quantity": 1000.0,
            "unit": "KG",
            "expected_price_per_kg": 15.0,
            "min_acceptable_price": 12.0,  # PRIVATE
            "harvest_date": "2026-11-20",
            "available_until": "2026-11-30",
            "quality_grade": "Grade A",
            "description": "Crisp red field tomatoes",
            "village": "Kotapally",
            "delivery_available": True,
            "pickup_available": True,
            "image_urls": []
        }
        res_prod = client.post("/api/v1/farmer/produce", json=produce_payload, headers=headers_f)
        assert res_prod.status_code == 201
        produce_data = res_prod.json()
        produce_id = produce_data["id"]
        # Farmer CAN see their own min_acceptable_price
        assert float(produce_data["min_acceptable_price"]) == 12.0

        # 5. Buyer browses produce: verify min_acceptable_price is MASKED / NONE!
        res_buyer_view = client.get(f"/api/v1/buyer/produce/{produce_id}", headers=headers_b)
        assert res_buyer_view.status_code == 200
        assert res_buyer_view.json()["min_acceptable_price"] is None

        # 6. Buyer Submits Purchase Offer (400 kg @ ₹14/kg)
        offer_payload = {
            "produce_id": produce_id,
            "quantity": 400.0,
            "offered_price_per_kg": 14.0,
            "delivery_method": "PICKUP",
            "additional_requirements": "Will pick up with own vehicle"
        }
        res_offer = client.post("/api/v1/buyer/offers", json=offer_payload, headers=headers_b)
        assert res_offer.status_code == 201
        offer_id = res_offer.json()["id"]

        # 7. Farmer accepts offer -> triggers atomic inventory reduction & order creation
        res_accept = client.post(f"/api/v1/farmer/offers/{offer_id}/accept", headers=headers_f)
        assert res_accept.status_code == 200
        accept_data = res_accept.json()
        assert float(accept_data["remaining_quantity"]) == 600.0  # 1000 - 400 = 600
        assert accept_data["produce_status"] == "PARTIALLY_SOLD"
        order_id = accept_data["order_id"]

        # 8. Prevent over-selling: A second offer requesting 800 kg (when only 600 kg is left) must be rejected
        res_excess_offer = client.post("/api/v1/buyer/offers", json={
            "produce_id": produce_id,
            "quantity": 800.0,
            "offered_price_per_kg": 13.0
        }, headers=headers_b)
        assert res_excess_offer.status_code == 400
        assert "exceeds" in res_excess_offer.json()["detail"].lower()

        # 9. Weighment Verification:
        # Gross = 420 kg, Container Tare = 20 kg => Net = 400 kg. Rejected = 10 kg => Accepted = 390 kg.
        # Agreed price = ₹14/kg => Final Amount = 390 * 14 = 5460
        weighment_payload = {
            "gross_weight": 420.0,
            "packaging_weight": 20.0,
            "rejected_quantity": 10.0,
            "quality_grade": "Grade A",
            "scale_slip_number": "SCALE-KTP-001",
            "notes": "Certified digital scale"
        }
        res_w = client.post(f"/api/v1/orders/{order_id}/weighment", json=weighment_payload, headers=headers_f)
        assert res_w.status_code == 200
        w_data = res_w.json()
        assert float(w_data["net_weight"]) == 400.0
        assert float(w_data["accepted_quantity"]) == 390.0
        assert float(w_data["final_payable_amount"]) == 5460.0

        # 10. Buyer Confirms Weighment
        res_conf = client.post(f"/api/v1/orders/{order_id}/weighment/confirm", json={"confirm": True}, headers=headers_b)
        assert res_conf.status_code == 200
        assert res_conf.json()["is_fully_confirmed"] is True

        # 11. Payment Processing (Escrow provider / Mock gateway)
        res_pay = client.post("/api/v1/payments/process", json={
            "order_id": order_id,
            "payment_type": "FULL",
            "payment_method": "ESCROW_MOCK"
        }, headers=headers_b)
        assert res_pay.status_code == 200
        pay_data = res_pay.json()
        assert pay_data["payment_status"] == "FULLY_PAID"
        assert pay_data["receipt_number"] is not None

        # 12. Dispute reporting
        res_disp = client.post("/api/v1/disputes", json={
            "order_id": order_id,
            "reason": "DELIVERY_ISSUES",
            "description": "Driver arrived 2 hours after agreed gate slot."
        }, headers=headers_f)
        assert res_disp.status_code == 201
        assert res_disp.json()["status"] == "OPEN"
