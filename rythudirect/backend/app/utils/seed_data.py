import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, FarmerProfile, BuyerProfile, BuyerVerification, UserRole
from app.models.produce import CropCategory, ProduceListing, ProduceImage
from app.models.offer import BuyerOffer, OfferNegotiation
from app.models.order import Order, OrderItem
from app.models.weighment import WeighmentRecord, QualityAssessment
from app.models.payment import PaymentTransaction
from app.models.dispute import Dispute
from app.models.market import MarketPrice
from app.models.notification import Notification
from app.services.notification_service import create_notification

def seed_database(db: Session):
    # Ensure tables exist
    import app.models
    Base.metadata.create_all(bind=engine)

    # Check if categories already seeded
    if db.query(CropCategory).first() is not None and db.query(User).filter(User.role == UserRole.ADMIN).first() is not None:
        print("Database already contains categories and admin. Skipping seed.")
        return

    print("Seeding RythuDirect database with comprehensive sample agricultural data...")

    # 1. CROP CATEGORIES
    if db.query(CropCategory).first() is None:
        categories = [
            CropCategory(name="Vegetables", description="Fresh vegetables directly from farm fields", icon="Carrot"),
            CropCategory(name="Grains & Cereals", description="Paddy, wheat, maize, millets", icon="Wheat"),
            CropCategory(name="Spices & Commercial", description="Chilli, turmeric, cotton, tobacco", icon="Flame"),
            CropCategory(name="Pulses", description="Red gram, green gram, black gram, bengal gram", icon="CircleDot"),
            CropCategory(name="Fruits", description="Mangoes, sweet lime, papaya, watermelons", icon="Apple"),
            CropCategory(name="Oilseeds", description="Groundnut, sesame, sunflower, soyabean", icon="Droplets"),
        ]
        for c in categories:
            db.add(c)
        db.commit()

    # 2. ADMIN USER
    admin_user = User(
        full_name="RythuDirect Admin",
        mobile_number="9999999999",
        email="admin@rythudirect.com",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
        village="Shamshabad",
        district="Ranga Reddy",
        state="Telangana",
        pincode="501218",
        is_active=True
    )
    db.add(admin_user)
    db.commit()

    # 3. FIVE SAMPLE FARMERS (Telangana & AP agricultural regions)
    farmers_data = [
        {
            "name": "Mallaiah Yadav", "mobile": "9848011111", "email": "mallaiah@farmer.com",
            "village": "Ghanpur", "district": "Jangaon", "state": "Telangana", "pincode": "506143",
            "farm_name": "Yadav Organic Farms", "location": "Near Ghanpur Lake, Survey No. 42",
            "crops": "Paddy, Tomato, Green Chilli", "size": Decimal("7.5")
        },
        {
            "name": "Rami Reddy", "mobile": "9848022222", "email": "ramireddy@farmer.com",
            "village": "Tadikonda", "district": "Guntur", "state": "Andhra Pradesh", "pincode": "522236",
            "farm_name": "Guntur Spices Agro", "location": "Main Canal Road",
            "crops": "Guntur Chilli (Teja), Cotton, Turmeric", "size": Decimal("12.0")
        },
        {
            "name": "Kavitha Bai", "mobile": "9848033333", "email": "kavitha@farmer.com",
            "village": "Armoor", "district": "Nizamabad", "state": "Telangana", "pincode": "503224",
            "farm_name": "Siri Natural Farm", "location": "NH 44 bypass farm",
            "crops": "Turmeric, Soyabean, Maize", "size": Decimal("5.0")
        },
        {
            "name": "Subba Rao Patrudu", "mobile": "9848044444", "email": "subbarao@farmer.com",
            "village": "Nuzvid", "district": "Eluru", "state": "Andhra Pradesh", "pincode": "521201",
            "farm_name": "Banganapalli Orchards", "location": "Mango Belt Zone 4",
            "crops": "Banganapalli Mango, Papaya, Guava", "size": Decimal("15.0")
        },
        {
            "name": "Anjaneyulu Kurva", "mobile": "9848055555", "email": "anjaneyulu@farmer.com",
            "village": "Dhone", "district": "Nandyal", "state": "Andhra Pradesh", "pincode": "518222",
            "farm_name": "Kurva Agro Fields", "location": "Survey 112, Dhone Road",
            "crops": "Onions, Groundnut, Red Gram", "size": Decimal("9.0")
        }
    ]

    farmer_users = []
    for fd in farmers_data:
        u = User(
            full_name=fd["name"],
            mobile_number=fd["mobile"],
            email=fd["email"],
            hashed_password=hash_password("farmer123"),
            role=UserRole.FARMER,
            village=fd["village"],
            district=fd["district"],
            state=fd["state"],
            pincode=fd["pincode"],
            is_active=True
        )
        db.add(u)
        db.flush()
        fp = FarmerProfile(
            user_id=u.id,
            farm_name=fd["farm_name"],
            farm_location=fd["location"],
            cultivated_crops=fd["crops"],
            farm_size_acres=fd["size"]
        )
        db.add(fp)
        farmer_users.append(u)
    db.commit()

    # 4. FIVE SAMPLE BUYERS
    buyers_data = [
        {
            "name": "Vikram Sethi", "mobile": "9700011111", "email": "vikram@hyderabadmandis.com",
            "business_name": "Sethi Agro Wholesalers Pvt Ltd", "business_type": "Wholesaler",
            "address": "Bowenpally Agricultural Market, Secunderabad", "category": "B2B",
            "verified": True, "rating": Decimal("4.9"), "deals": 42
        },
        {
            "name": "Suresh Chandra", "mobile": "9700022222", "email": "suresh@freshhyper.com",
            "business_name": "FreshRoots Supermarkets Chain", "business_type": "Supermarket",
            "address": "Madhapur, Hitech City, Hyderabad", "category": "Retail",
            "verified": True, "rating": Decimal("4.8"), "deals": 28
        },
        {
            "name": "Deepak Agarwal", "mobile": "9700033333", "email": "deepak@deccanfoods.com",
            "business_name": "Deccan Food Processing Industries", "business_type": "Food Processing Co",
            "address": "Industrial Park, Guntur", "category": "Institutional",
            "verified": True, "rating": Decimal("4.7"), "deals": 35
        },
        {
            "name": "Chef Narayana Murthy", "mobile": "9700044444", "email": "murthy@grandhotel.com",
            "business_name": "Kakatiya Grand Hotel & Catering", "business_type": "Restaurant",
            "address": "Hanamkonda, Warangal", "category": "HoReCa",
            "verified": False, "rating": Decimal("4.5"), "deals": 8
        },
        {
            "name": "Priya Sharma", "mobile": "9700055555", "email": "priya@sharmaretail.com",
            "business_name": "Sharma Organics & Green Grocery", "business_type": "Retailer",
            "address": "Dilsukhnagar Main Road, Hyderabad", "category": "Retail",
            "verified": True, "rating": Decimal("4.9"), "deals": 19
        }
    ]

    buyer_users = []
    for bd in buyers_data:
        u = User(
            full_name=bd["name"],
            mobile_number=bd["mobile"],
            email=bd["email"],
            hashed_password=hash_password("buyer123"),
            role=UserRole.BUYER,
            village="Hyderabad Central",
            district="Hyderabad",
            state="Telangana",
            pincode="500001",
            is_active=True
        )
        db.add(u)
        db.flush()
        bp = BuyerProfile(
            user_id=u.id,
            business_name=bd["business_name"],
            business_type=bd["business_type"],
            business_address=bd["address"],
            buyer_category=bd["category"],
            is_verified=bd["verified"],
            rating=bd["rating"],
            total_deals_completed=bd["deals"]
        )
        db.add(bp)
        db.flush()

        # Verification record
        bv = BuyerVerification(
            buyer_id=bp.id,
            document_type="GSTIN & APMC Trader License",
            document_number=f"36AABCS{1000 + bp.id}Z1Z5",
            document_url="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
            status="APPROVED" if bd["verified"] else "PENDING",
            admin_notes="Verified via APMC trader registry." if bd["verified"] else "Pending tax verification",
            reviewed_at=datetime.datetime.utcnow() if bd["verified"] else None,
            reviewed_by_id=admin_user.id if bd["verified"] else None
        )
        db.add(bv)
        buyer_users.append(u)
    db.commit()

    # 5. FIFTEEN SAMPLE PRODUCE LISTINGS
    cats = {c.name: c.id for c in db.query(CropCategory).all()}
    today = datetime.date.today()

    listings_data = [
        {
            "farmer": farmer_users[0], "crop": "Hybrid Red Tomatoes (Sahu)", "cat": cats["Vegetables"],
            "qty": Decimal("1500.0"), "unit": "KG", "price": Decimal("14.0"), "min_price": Decimal("12.0"),
            "harvest": today - datetime.timedelta(days=1), "avail": today + datetime.timedelta(days=7),
            "grade": "Grade A", "village": "Ghanpur", "desc": "Freshly plucked firm red tomatoes, high shelf life, uniform size.",
            "img": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600"
        },
        {
            "farmer": farmer_users[1], "crop": "Guntur Teja Dry Red Chilli", "cat": cats["Spices & Commercial"],
            "qty": Decimal("3000.0"), "unit": "KG", "price": Decimal("185.0"), "min_price": Decimal("170.0"),
            "harvest": today - datetime.timedelta(days=5), "avail": today + datetime.timedelta(days=30),
            "grade": "Grade A", "village": "Tadikonda", "desc": "Premium export quality Teja red chilli. SHU > 75000, bright red colour, well sun-dried.",
            "img": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600"
        },
        {
            "farmer": farmer_users[0], "crop": "Telangana Sona (RNR 15048) Paddy", "cat": cats["Grains & Cereals"],
            "qty": Decimal("5000.0"), "unit": "KG", "price": Decimal("24.5"), "min_price": Decimal("22.0"),
            "harvest": today - datetime.timedelta(days=10), "avail": today + datetime.timedelta(days=60),
            "grade": "Grade A", "village": "Ghanpur", "desc": "Low Glycemic Index (GI) certified paddy. Moisture content below 12%, minimal broken grain.",
            "img": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600"
        },
        {
            "farmer": farmer_users[1], "crop": "Long Staple Organic Cotton", "cat": cats["Spices & Commercial"],
            "qty": Decimal("4000.0"), "unit": "KG", "price": Decimal("72.0"), "min_price": Decimal("68.0"),
            "harvest": today - datetime.timedelta(days=7), "avail": today + datetime.timedelta(days=45),
            "grade": "Grade A", "village": "Tadikonda", "desc": "Clean hand-picked 29mm staple raw cotton. Free from yellow stains and leaf trash.",
            "img": "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600"
        },
        {
            "farmer": farmer_users[2], "crop": "Nizamabad Salem Turmeric Fingers", "cat": cats["Spices & Commercial"],
            "qty": Decimal("2500.0"), "unit": "KG", "price": Decimal("95.0"), "min_price": Decimal("88.0"),
            "harvest": today - datetime.timedelta(days=15), "avail": today + datetime.timedelta(days=90),
            "grade": "Grade A", "village": "Armoor", "desc": "Curcumin content > 3.8%. High aroma, polished yellow fingers, zero artificial polish.",
            "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600"
        },
        {
            "farmer": farmer_users[4], "crop": "Bellary Red Onions", "cat": cats["Vegetables"],
            "qty": Decimal("6000.0"), "unit": "KG", "price": Decimal("18.0"), "min_price": Decimal("15.5"),
            "harvest": today - datetime.timedelta(days=3), "avail": today + datetime.timedelta(days=20),
            "grade": "Grade B", "village": "Dhone", "desc": "Medium to large dry bulb onions. Cured well for long storage and long-distance transport.",
            "img": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600"
        },
        {
            "farmer": farmer_users[4], "crop": "Kurnool Groundnut Pods (K6)", "cat": cats["Oilseeds"],
            "qty": Decimal("3500.0"), "unit": "KG", "price": Decimal("65.0"), "min_price": Decimal("60.0"),
            "harvest": today - datetime.timedelta(days=8), "avail": today + datetime.timedelta(days=40),
            "grade": "Grade A", "village": "Dhone", "desc": "Two-seeded plump pods, oil content > 48%, moisture below 7%, suitable for oil mills.",
            "img": "https://images.unsplash.com/photo-1567892305541-155e8211db4a?w=600"
        },
        {
            "farmer": farmer_users[3], "crop": "Banganapalli Table Mangoes", "cat": cats["Fruits"],
            "qty": Decimal("2000.0"), "unit": "KG", "price": Decimal("55.0"), "min_price": Decimal("48.0"),
            "harvest": today - datetime.timedelta(days=2), "avail": today + datetime.timedelta(days=12),
            "grade": "Grade A", "village": "Nuzvid", "desc": "Naturally ripened GI tagged Nuzvid Banganapalli mangoes. Sweet pulp, fibreless texture.",
            "img": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600"
        },
        {
            "farmer": farmer_users[2], "crop": "Yellow Field Maize (Corn)", "cat": cats["Grains & Cereals"],
            "qty": Decimal("8000.0"), "unit": "KG", "price": Decimal("19.5"), "min_price": Decimal("18.0"),
            "harvest": today - datetime.timedelta(days=12), "avail": today + datetime.timedelta(days=60),
            "grade": "Grade B", "village": "Armoor", "desc": "Clean grain maize for poultry feed & starch factories. Aflatoxin below 20 ppb.",
            "img": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600"
        },
        {
            "farmer": farmer_users[0], "crop": "G4 Hot Green Chillies", "cat": cats["Vegetables"],
            "qty": Decimal("800.0"), "unit": "KG", "price": Decimal("38.0"), "min_price": Decimal("32.0"),
            "harvest": today - datetime.timedelta(days=1), "avail": today + datetime.timedelta(days=5),
            "grade": "Grade A", "village": "Ghanpur", "desc": "Spicy long slender green chillies. Plucked yesterday evening, packed in breathable mesh.",
            "img": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600"
        },
        {
            "farmer": farmer_users[4], "crop": "Desi Red Gram (Toor Dal)", "cat": cats["Pulses"],
            "qty": Decimal("2200.0"), "unit": "KG", "price": Decimal("88.0"), "min_price": Decimal("82.0"),
            "harvest": today - datetime.timedelta(days=18), "avail": today + datetime.timedelta(days=90),
            "grade": "Grade A", "village": "Dhone", "desc": "Whole unpolished desi red gram. High protein content, machine cleaned and destoned.",
            "img": "https://images.unsplash.com/photo-1585992629736-1e66c04f981e?w=600"
        },
        {
            "farmer": farmer_users[2], "crop": "Yellow Soyabean Seeds (JS 335)", "cat": cats["Oilseeds"],
            "qty": Decimal("4500.0"), "unit": "KG", "price": Decimal("42.0"), "min_price": Decimal("39.0"),
            "harvest": today - datetime.timedelta(days=14), "avail": today + datetime.timedelta(days=45),
            "grade": "Grade B", "village": "Armoor", "desc": "High protein oilseed variety. Moisture 10%, sound clean beans.",
            "img": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600"
        },
        {
            "farmer": farmer_users[3], "crop": "Taiwan 786 Red Lady Papaya", "cat": cats["Fruits"],
            "qty": Decimal("3000.0"), "unit": "KG", "price": Decimal("16.0"), "min_price": Decimal("13.0"),
            "harvest": today - datetime.timedelta(days=1), "avail": today + datetime.timedelta(days=6),
            "grade": "Grade A", "village": "Nuzvid", "desc": "Firm semi-ripe papayas, average fruit weight 1.5 - 2.0 kg. Thick red sweet flesh.",
            "img": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600"
        },
        {
            "farmer": farmer_users[0], "crop": "Green Cabbage (F1 Hybrid)", "cat": cats["Vegetables"],
            "qty": Decimal("2000.0"), "unit": "KG", "price": Decimal("12.0"), "min_price": Decimal("9.5"),
            "harvest": today - datetime.timedelta(days=2), "avail": today + datetime.timedelta(days=8),
            "grade": "Grade B", "village": "Ghanpur", "desc": "Solid compact heads with fresh green outer leaves. Transport-ready in 50kg bags.",
            "img": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600"
        },
        {
            "farmer": farmer_users[1], "crop": "Sugarcane Juice Canes (Co 86032)", "cat": cats["Spices & Commercial"],
            "qty": Decimal("10000.0"), "unit": "KG", "price": Decimal("3.8"), "min_price": Decimal("3.2"),
            "harvest": today, "avail": today + datetime.timedelta(days=10),
            "grade": "Grade A", "village": "Tadikonda", "desc": "High brix juice canes, pest-free stems, direct field loading available.",
            "img": "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600"
        }
    ]

    produce_listings = []
    for ld in listings_data:
        pl = ProduceListing(
            farmer_id=ld["farmer"].id,
            category_id=ld["cat"],
            crop_name=ld["crop"],
            quantity=ld["qty"],
            unit=ld["unit"],
            remaining_quantity=ld["qty"],
            expected_price_per_kg=ld["price"],
            min_acceptable_price=ld["min_price"], # Strictly private
            harvest_date=ld["harvest"],
            available_until=ld["avail"],
            quality_grade=ld["grade"],
            description=ld["desc"],
            village=ld["village"],
            delivery_location=f"{ld['village']}, {ld['farmer'].district}",
            delivery_available=True,
            pickup_available=True,
            status="ACTIVE"
        )
        db.add(pl)
        db.flush()

        img = ProduceImage(
            produce_id=pl.id,
            image_url=ld["img"],
            is_primary=True
        )
        db.add(img)
        produce_listings.append(pl)
    db.commit()

    # 6. TEN SAMPLE BUYER OFFERS (demonstrating multi-buyer quotations on same produce as in Req 6)
    # Produce 0 is Tomatoes (1500 kg, expected ₹14/kg)
    # Buyer 0 offers 500 kg @ ₹12
    # Buyer 1 offers 1000 kg @ ₹14
    # Buyer 2 offers 1500 kg @ ₹13
    offers_data = [
        {"produce": produce_listings[0], "buyer": buyer_users[0], "qty": Decimal("500.0"), "price": Decimal("12.0"), "status": "PENDING", "method": "PICKUP", "note": "Can pick up in crates directly from farm."},
        {"produce": produce_listings[0], "buyer": buyer_users[1], "qty": Decimal("1000.0"), "price": Decimal("14.0"), "status": "PENDING", "method": "DELIVERY", "note": "Deliver to our Madhapur cold facility."},
        {"produce": produce_listings[0], "buyer": buyer_users[2], "qty": Decimal("1500.0"), "price": Decimal("13.0"), "status": "PENDING", "method": "PICKUP", "note": "Full lot purchase for puree factory."},
        
        # Produce 1 is Guntur Chilli (3000 kg, expected ₹185)
        {"produce": produce_listings[1], "buyer": buyer_users[0], "qty": Decimal("1500.0"), "price": Decimal("175.0"), "status": "COUNTERED", "method": "PICKUP", "note": "High volume wholesale deal."},
        {"produce": produce_listings[1], "buyer": buyer_users[2], "qty": Decimal("2000.0"), "price": Decimal("180.0"), "status": "PENDING", "method": "DELIVERY", "note": "For spice extraction plant."},

        # Produce 2 is Paddy (5000 kg, expected ₹24.5)
        {"produce": produce_listings[2], "buyer": buyer_users[0], "qty": Decimal("3000.0"), "price": Decimal("23.0"), "status": "PENDING", "method": "PICKUP", "note": "Immediate weighbridge clearance."},

        # Produce 5 is Onions (6000 kg, expected ₹18.0)
        {"produce": produce_listings[5], "buyer": buyer_users[1], "qty": Decimal("2000.0"), "price": Decimal("16.5"), "status": "PENDING", "method": "DELIVERY", "note": "Weekly delivery needed."},
        {"produce": produce_listings[5], "buyer": buyer_users[4], "qty": Decimal("1000.0"), "price": Decimal("17.0"), "status": "PENDING", "method": "PICKUP", "note": "Retail stores procurement."},

        # Produce 7 is Mangoes (2000 kg, expected ₹55.0)
        {"produce": produce_listings[7], "buyer": buyer_users[1], "qty": Decimal("1000.0"), "price": Decimal("52.0"), "status": "PENDING", "method": "PICKUP", "note": "Premium crate packing required."},
        {"produce": produce_listings[7], "buyer": buyer_users[3], "qty": Decimal("500.0"), "price": Decimal("50.0"), "status": "PENDING", "method": "DELIVERY", "note": "Hotel kitchen consumption."}
    ]

    buyer_offers = []
    for od in offers_data:
        bo = BuyerOffer(
            produce_id=od["produce"].id,
            buyer_id=od["buyer"].id,
            quantity=od["qty"],
            offered_price_per_kg=od["price"],
            preferred_delivery_date=today + datetime.timedelta(days=3),
            delivery_method=od["method"],
            additional_requirements=od["note"],
            status=od["status"]
        )
        db.add(bo)
        db.flush()

        neg = OfferNegotiation(
            offer_id=bo.id,
            sender_id=od["buyer"].id,
            counter_price_per_kg=od["price"],
            counter_quantity=od["qty"],
            notes=od["note"]
        )
        db.add(neg)
        buyer_offers.append(bo)
    db.commit()

    # 7. SAMPLE CONFIRMED ORDERS WITH WEIGHMENT & PAYMENTS
    # Let's create an active order that has weighment pending, and another with weighment completed + advance paid
    # Order 1: Cotton (Buyer 2 from Farmer 1)
    ord1_qty = Decimal("1500.0")
    ord1_price = Decimal("70.0")
    ord1_total = ord1_qty * ord1_price

    order1 = Order(
        order_number=f"ORD-{today.strftime('%Y%m%d')}-COT001",
        produce_id=produce_listings[3].id,
        farmer_id=farmer_users[1].id,
        buyer_id=buyer_users[2].id,
        agreed_quantity=ord1_qty,
        agreed_price_per_kg=ord1_price,
        total_estimated_amount=ord1_total,
        status="WEIGHMENT_COMPLETED",
        delivery_method="PICKUP",
        delivery_address="Tadikonda Village Main Weighbridge"
    )
    db.add(order1)
    db.flush()

    item1 = OrderItem(
        order_id=order1.id,
        crop_name="Long Staple Organic Cotton",
        quantity=ord1_qty,
        price_per_kg=ord1_price,
        total_price=ord1_total
    )
    db.add(item1)

    # Weighment for Order 1
    # Gross 1580 kg, Tare (packaging/vehicle crates) 80 kg, Net 1500 kg, Accepted 1480 kg, Rejected 20 kg
    net_wt = Decimal("1500.0")
    accepted_wt = Decimal("1480.0")
    final_amt = accepted_wt * ord1_price # 1480 * 70 = 103,600

    weighment1 = WeighmentRecord(
        order_id=order1.id,
        original_listed_quantity=ord1_qty,
        gross_weight=Decimal("1580.0"),
        packaging_weight=Decimal("80.0"),
        net_weight=net_wt,
        accepted_quantity=accepted_wt,
        rejected_quantity=Decimal("20.0"),
        agreed_price_per_kg=ord1_price,
        final_payable_amount=final_amt,
        quality_grade="Grade A",
        scale_slip_number="WB-TDK-2026-884",
        photo_evidence_url="https://images.unsplash.com/photo-1594897030560-84a5585094a8?w=600",
        farmer_confirmed=True,
        farmer_confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        buyer_confirmed=True,
        buyer_confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
        verification_timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
        notes="Scale certified by Legal Metrology Dept. 20 kg rejected due to moisture dampening."
    )
    db.add(weighment1)

    # Advance Payment for Order 1
    adv_amt = Decimal("30000.0")
    payment1 = PaymentTransaction(
        order_id=order1.id,
        transaction_reference="TXN-ESCROW-COT7712",
        amount=final_amt,
        advance_amount=adv_amt,
        outstanding_balance=final_amt - adv_amt,
        payment_status="ADVANCE_PAID",
        payment_method="ESCROW_MOCK",
        due_date=today + datetime.timedelta(days=5),
        confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        receipt_number="REC-RYTHU-2026-COT91",
        gateway_response='{"status": "ADVANCE_HELD_IN_ESCROW", "amount": 30000, "provider": "RythuDirect Escrow Provider"}'
    )
    db.add(payment1)

    # Order 2: Nizamabad Turmeric (Buyer 0 from Farmer 2)
    ord2_qty = Decimal("1000.0")
    ord2_price = Decimal("92.0")
    ord2_total = ord2_qty * ord2_price

    order2 = Order(
        order_number=f"ORD-{today.strftime('%Y%m%d')}-TUR002",
        produce_id=produce_listings[4].id,
        farmer_id=farmer_users[2].id,
        buyer_id=buyer_users[0].id,
        agreed_quantity=ord2_qty,
        agreed_price_per_kg=ord2_price,
        total_estimated_amount=ord2_total,
        status="COMPLETED",
        delivery_method="DELIVERY",
        delivery_address="Bowenpally Agricultural Market, Yard 4"
    )
    db.add(order2)
    db.flush()

    item2 = OrderItem(
        order_id=order2.id,
        crop_name="Nizamabad Salem Turmeric Fingers",
        quantity=ord2_qty,
        price_per_kg=ord2_price,
        total_price=ord2_total
    )
    db.add(item2)

    weighment2 = WeighmentRecord(
        order_id=order2.id,
        original_listed_quantity=ord2_qty,
        gross_weight=Decimal("1050.0"),
        packaging_weight=Decimal("50.0"),
        net_weight=Decimal("1000.0"),
        accepted_quantity=Decimal("1000.0"),
        rejected_quantity=Decimal("0.0"),
        agreed_price_per_kg=ord2_price,
        final_payable_amount=ord2_total,
        quality_grade="Grade A",
        scale_slip_number="WB-NZB-2026-102",
        photo_evidence_url="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600",
        farmer_confirmed=True,
        farmer_confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        buyer_confirmed=True,
        buyer_confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        verification_timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        notes="Zero rejection. High aroma turmeric fingers."
    )
    db.add(weighment2)

    payment2 = PaymentTransaction(
        order_id=order2.id,
        transaction_reference="TXN-ESCROW-TUR9904",
        amount=ord2_total,
        advance_amount=ord2_total,
        outstanding_balance=Decimal("0.0"),
        payment_status="FULLY_PAID",
        payment_method="BANK_TRANSFER",
        due_date=today,
        confirmed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        receipt_number="REC-RYTHU-2026-TUR44",
        gateway_response='{"status": "SUCCESS", "amount": 92000, "provider": "RythuDirect Escrow Provider"}'
    )
    db.add(payment2)

    # Sample Dispute on a past order
    dispute = Dispute(
        order_id=order1.id,
        raised_by_id=farmer_users[1].id,
        reason="UNFAIR_QUALITY_DEDUCTION",
        description="Buyer deducted 20 kg claiming excess moisture. However moisture test certificate showed 11.2% which is within Grade A limit.",
        status="OPEN"
    )
    db.add(dispute)
    db.commit()

    # 8. SAMPLE MANDI MARKET PRICES (With explicit dates and authorized official feed labels)
    market_feed_source = "Agmarknet / Directorate of Marketing & Inspection (DMI), Ministry of Agriculture, Govt of India"
    
    market_prices_data = [
        # Tomato across mandis
        {"crop": "Tomato", "mandi": "Bowenpally Mandi", "dist": "Hyderabad", "min": Decimal("11.0"), "max": Decimal("16.0"), "modal": Decimal("13.5")},
        {"crop": "Tomato", "mandi": "Warangal APMC", "dist": "Warangal", "min": Decimal("10.0"), "max": Decimal("15.0"), "modal": Decimal("12.5")},
        {"crop": "Tomato", "mandi": "Gudur Market Yard", "dist": "Tirupati", "min": Decimal("12.0"), "max": Decimal("17.0"), "modal": Decimal("14.0")},
        {"crop": "Tomato", "mandi": "Madanapalle Mandi", "dist": "Annamayya", "min": Decimal("13.0"), "max": Decimal("18.5"), "modal": Decimal("15.0")},
        
        # Red Chilli across mandis
        {"crop": "Red Chilli", "mandi": "Guntur APMC Yard", "dist": "Guntur", "min": Decimal("165.0"), "max": Decimal("195.0"), "modal": Decimal("182.0")},
        {"crop": "Red Chilli", "mandi": "Warangal Enkoor Market", "dist": "Warangal", "min": Decimal("160.0"), "max": Decimal("188.0"), "modal": Decimal("176.0")},
        {"crop": "Red Chilli", "mandi": "Khammam Mandi", "dist": "Khammam", "min": Decimal("162.0"), "max": Decimal("190.0"), "modal": Decimal("179.0")},

        # Paddy
        {"crop": "Paddy (Common)", "mandi": "Suryapet APMC", "dist": "Suryapet", "min": Decimal("21.5"), "max": Decimal("24.0"), "modal": Decimal("23.0")},
        {"crop": "Paddy (Common)", "mandi": "Nizamabad Market Yard", "dist": "Nizamabad", "min": Decimal("22.0"), "max": Decimal("24.8"), "modal": Decimal("23.5")},
        {"crop": "Paddy (Common)", "mandi": "Miryalaguda Mandi", "dist": "Nalgonda", "min": Decimal("22.5"), "max": Decimal("25.2"), "modal": Decimal("24.0")},

        # Turmeric
        {"crop": "Turmeric", "mandi": "Nizamabad APMC", "dist": "Nizamabad", "min": Decimal("85.0"), "max": Decimal("105.0"), "modal": Decimal("94.0")},
        {"crop": "Turmeric", "mandi": "Duggirala Market", "dist": "Guntur", "min": Decimal("88.0"), "max": Decimal("108.0"), "modal": Decimal("96.5")},
        {"crop": "Turmeric", "mandi": "Kesamudram Mandi", "dist": "Mahabubabad", "min": Decimal("82.0"), "max": Decimal("100.0"), "modal": Decimal("91.0")},

        # Cotton
        {"crop": "Cotton", "mandi": "Adilabad APMC", "dist": "Adilabad", "min": Decimal("65.0"), "max": Decimal("74.0"), "modal": Decimal("71.0")},
        {"crop": "Cotton", "mandi": "Guntur Yard", "dist": "Guntur", "min": Decimal("67.0"), "max": Decimal("75.5"), "modal": Decimal("72.5")},

        # Onion
        {"crop": "Onion", "mandi": "Bowenpally Mandi", "dist": "Hyderabad", "min": Decimal("14.0"), "max": Decimal("21.0"), "modal": Decimal("17.5")},
        {"crop": "Onion", "mandi": "Kurnool Market", "dist": "Kurnool", "min": Decimal("13.0"), "max": Decimal("19.0"), "modal": Decimal("16.0")},

        # Groundnut
        {"crop": "Groundnut", "mandi": "Yemmiganur APMC", "dist": "Kurnool", "min": Decimal("58.0"), "max": Decimal("68.0"), "modal": Decimal("64.0")},
        {"crop": "Groundnut", "mandi": "Gadwal Market", "dist": "Jogulamba Gadwal", "min": Decimal("59.0"), "max": Decimal("69.5"), "modal": Decimal("65.0")},

        # Banganapalli Mango
        {"crop": "Mango", "mandi": "Gaddiannaram Fruit Market", "dist": "Hyderabad", "min": Decimal("45.0"), "max": Decimal("65.0"), "modal": Decimal("54.0")},
        {"crop": "Mango", "mandi": "Nuzvid Market", "dist": "Eluru", "min": Decimal("40.0"), "max": Decimal("58.0"), "modal": Decimal("49.0")}
    ]

    for mp in market_prices_data:
        m = MarketPrice(
            crop_name=mp["crop"],
            market_name=mp["mandi"],
            district=mp["dist"],
            state="Telangana" if mp["dist"] in ["Hyderabad", "Warangal", "Suryapet", "Nizamabad", "Miryalaguda", "Adilabad", "Khammam", "Mahabubabad", "Jogulamba Gadwal"] else "Andhra Pradesh",
            min_price=mp["min"],
            max_price=mp["max"],
            modal_price=mp["modal"],
            observation_date=today,
            data_source=market_feed_source
        )
        db.add(m)

    # 9. Initial Notifications
    create_notification(
        db=db,
        user_id=farmer_users[0].id,
        title="Welcome to RythuDirect!",
        message="Your farm profile is active. Post your harvest listings and receive direct competitive bids from verified buyers.",
        notification_type="INFO",
        link="/farmer/produce"
    )
    create_notification(
        db=db,
        user_id=buyer_users[0].id,
        title="Welcome to RythuDirect!",
        message="Your account is verified. Discover premium produce directly from farmers with transparent weighment.",
        notification_type="INFO",
        link="/buyer/produce"
    )

    db.commit()
    print("RythuDirect sample data successfully populated!")
