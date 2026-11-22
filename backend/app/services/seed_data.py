from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.core import security
from app.models.user import User, FarmerProfile, BuyerProfile
from app.models.produce import CropCategory, ProduceListing, ProduceImage
from app.models.offer import BuyerOffer, OfferNegotiation
from app.models.order import Order, WeighmentRecord, QualityAssessment
from app.models.payment import PaymentTransaction
from app.models.market_price import MarketPrice
from app.models.notification import Notification

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    print("🌱 Seeding RythuDirect database with initial categories, test accounts, and labeled sample data...")

    # 1. Categories
    categories_data = [
        {"name": "Vegetables", "slug": "vegetables", "icon": "Carrot", "description": "Fresh farm-grown vegetables"},
        {"name": "Grains & Cereals", "slug": "grains-cereals", "icon": "Wheat", "description": "Paddy, wheat, maize, millets"},
        {"name": "Pulses & Legumes", "slug": "pulses", "icon": "Bean", "description": "Red gram, green gram, black gram, bengal gram"},
        {"name": "Fruits", "slug": "fruits", "icon": "Apple", "description": "Seasonal and perennial orchard fruits"},
        {"name": "Spices & Commercial", "slug": "spices", "icon": "Flame", "description": "Red chillies, turmeric, cotton, oilseeds"},
    ]
    categories = {}
    for cat in categories_data:
        c = CropCategory(**cat)
        db.add(c)
        db.flush()
        categories[cat["slug"]] = c

    # 2. Admin User
    admin = User(
        full_name="Platform Administrator",
        mobile_number="9876543200",
        email="admin@rythudirect.in",
        password_hash=security.get_password_hash("Admin@123"),
        role="admin",
        village="Nanakramguda",
        district="Hyderabad",
        state="Telangana",
        pincode="500032",
        is_active=True
    )
    db.add(admin)

    # 3. 5 Farmers
    farmers_data = [
        {
            "full_name": "Rami Reddy",
            "mobile_number": "9876543210", # Primary demo farmer
            "email": "ramireddy@example.com",
            "village": "Madanapalle",
            "district": "Annamayya",
            "state": "Andhra Pradesh",
            "pincode": "517325",
            "farm_name": "Reddy Organic Farms",
            "farm_location": "Survey 42/B, Madanapalle Bypass",
            "crops_cultivated": "Tomatoes, Mangoes, Chillies",
            "farm_size_acres": 12.5,
            "experience_years": 18,
            "organic_certified": True
        },
        {
            "full_name": "Venkat Rao",
            "mobile_number": "9876543211",
            "email": "venkatrao@example.com",
            "village": "Miryalaguda",
            "district": "Nalgonda",
            "state": "Telangana",
            "pincode": "508207",
            "farm_name": "Krishna Valley Agro",
            "farm_location": "Canal Road, Miryalaguda",
            "crops_cultivated": "Sona Masoori Paddy, Cotton, Pulses",
            "farm_size_acres": 25.0,
            "experience_years": 22,
            "organic_certified": False
        },
        {
            "full_name": "Lakshmi Narayana",
            "mobile_number": "9876543212",
            "email": "narayana@example.com",
            "village": "Tadepalligudem",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "pincode": "534101",
            "farm_name": "Godavari Green Orchards",
            "farm_location": "NH-16 Feeder, Tadepalligudem",
            "crops_cultivated": "Onions, Bananas, Paddy",
            "farm_size_acres": 15.0,
            "experience_years": 15,
            "organic_certified": False
        },
        {
            "full_name": "Mallesh Goud",
            "mobile_number": "9876543213",
            "email": "mallesh@example.com",
            "village": "Shamshabad",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "pincode": "501218",
            "farm_name": "Deccan Fresh Vegetables",
            "farm_location": "Airport Road, Shamshabad",
            "crops_cultivated": "Green Chillies, Okra, Brinjal, Leafy Greens",
            "farm_size_acres": 8.0,
            "experience_years": 11,
            "organic_certified": True
        },
        {
            "full_name": "Subba Rao",
            "mobile_number": "9876543214",
            "email": "subbarao@example.com",
            "village": "Tenali",
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "pincode": "522201",
            "farm_name": "Tenali Spice Fields",
            "farm_location": "Delta Road, Tenali",
            "crops_cultivated": "Teja Red Chillies, Turmeric, Black Gram",
            "farm_size_acres": 18.0,
            "experience_years": 25,
            "organic_certified": False
        }
    ]

    farmers = []
    for fd in farmers_data:
        f_user = User(
            full_name=fd["full_name"],
            mobile_number=fd["mobile_number"],
            email=fd["email"],
            password_hash=security.get_password_hash("Farmer@123"),
            role="farmer",
            village=fd["village"],
            district=fd["district"],
            state=fd["state"],
            pincode=fd["pincode"],
            is_active=True
        )
        db.add(f_user)
        db.flush()

        fp = FarmerProfile(
            user_id=f_user.id,
            farm_name=fd["farm_name"],
            farm_location=fd["farm_location"],
            crops_cultivated=fd["crops_cultivated"],
            farm_size_acres=fd["farm_size_acres"],
            experience_years=fd["experience_years"],
            organic_certified=fd["organic_certified"]
        )
        db.add(fp)
        farmers.append(f_user)

    # 4. 5 Buyers
    buyers_data = [
        {
            "full_name": "Suresh Agarwal",
            "mobile_number": "9876543220", # Primary demo buyer
            "email": "suresh@agrawaltraders.in",
            "village": "Begum Bazar",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500012",
            "business_name": "Agarwal Wholesale Mandi Traders",
            "business_type": "Wholesaler",
            "business_address": "Shop 14-2-88, Begum Bazar Wholesale Grain Market, Hyderabad",
            "buyer_category": "Bulk Trader",
            "gstin_pan": "36AABCA1234F1Z5",
            "verification_status": "verified"
        },
        {
            "full_name": "Priya Sharma",
            "mobile_number": "9876543221",
            "email": "priya@freshbasket.com",
            "village": "Madhapur",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500081",
            "business_name": "FreshBasket Supermarkets Ltd",
            "business_type": "Supermarket",
            "business_address": "Plot 18, Cyber Towers Road, Madhapur, Hyderabad",
            "buyer_category": "Retail Outlet",
            "gstin_pan": "36BBCCD9876K1Z9",
            "verification_status": "verified"
        },
        {
            "full_name": "Chef Anand Varma",
            "mobile_number": "9876543222",
            "email": "procurement@tajgrand.in",
            "village": "Banjara Hills",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500034",
            "business_name": "Grand Horizon Hotels & Resorts",
            "business_type": "Hotel/Restaurant",
            "business_address": "Road No. 1, Banjara Hills, Hyderabad",
            "buyer_category": "Hospitality",
            "gstin_pan": "36CCDDX4321L1Z2",
            "verification_status": "verified"
        },
        {
            "full_name": "Satish Chandra",
            "mobile_number": "9876543223",
            "email": "satish@apfoods.co",
            "village": "Auto Nagar",
            "district": "Vijayawada",
            "state": "Andhra Pradesh",
            "pincode": "520007",
            "business_name": "Andhra Agro Processing Industries",
            "business_type": "Food Processor",
            "business_address": "Industrial Estate, Auto Nagar, Vijayawada",
            "buyer_category": "Processing",
            "gstin_pan": "37DDEEF5678M1Z7",
            "verification_status": "verified"
        },
        {
            "full_name": "Kiran Kumar",
            "mobile_number": "9876543224",
            "email": "kiran.retail@gmail.com",
            "village": "Kothapet",
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "pincode": "522001",
            "business_name": "Kiran Farm Fresh Retail",
            "business_type": "Retailer",
            "business_address": "Main Road, Kothapet Fruit Market, Guntur",
            "buyer_category": "Retail Outlet",
            "gstin_pan": "37FFGGH6789N1Z4",
            "verification_status": "pending"
        }
    ]

    buyers = []
    for bd in buyers_data:
        b_user = User(
            full_name=bd["full_name"],
            mobile_number=bd["mobile_number"],
            email=bd["email"],
            password_hash=security.get_password_hash("Buyer@123"),
            role="buyer",
            village=bd["village"],
            district=bd["district"],
            state=bd["state"],
            pincode=bd["pincode"],
            is_active=True
        )
        db.add(b_user)
        db.flush()

        bp = BuyerProfile(
            user_id=b_user.id,
            business_name=bd["business_name"],
            business_type=bd["business_type"],
            business_address=bd["business_address"],
            buyer_category=bd["buyer_category"],
            gstin_pan=bd["gstin_pan"],
            verification_status=bd["verification_status"],
            verified_at=datetime.utcnow() if bd["verification_status"] == "verified" else None,
            verification_notes="Verified GST & Business Trade License" if bd["verification_status"] == "verified" else "Documents under review"
        )
        db.add(bp)
        buyers.append(b_user)

    # 5. 15 Produce Listings (High Quality agricultural produce)
    today = date.today()
    produce_seed = [
        # Farmer 0 (Rami Reddy - Madanapalle)
        {
            "farmer": farmers[0],
            "cat": categories["vegetables"],
            "crop_name": "Hybrid Tomatoes (Sahu)",
            "variety": "Sahu-11",
            "total_quantity": 2500,
            "available_quantity": 1500,
            "unit": "kg",
            "asking_price": 18.0,
            "min_acceptable": 14.0, # PRIVATE!
            "harvest_date": today - timedelta(days=2),
            "available_until": today + timedelta(days=12),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Madanapalle",
            "district": "Annamayya",
            "state": "Andhra Pradesh",
            "desc": "High shelf-life table & processing tomatoes. Uniform red color, firm pulp, sorting and crate packaging completed.",
            "images": ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"]
        },
        {
            "farmer": farmers[0],
            "cat": categories["fruits"],
            "crop_name": "Banganapalli Mangoes",
            "variety": "Geographical Indication (GI) Tag",
            "total_quantity": 4000,
            "available_quantity": 4000,
            "unit": "kg",
            "asking_price": 75.0,
            "min_acceptable": 62.0,
            "harvest_date": today - timedelta(days=1),
            "available_until": today + timedelta(days=20),
            "quality_grade": "Organic Premium",
            "delivery_options": "delivery_available",
            "village": "Madanapalle",
            "district": "Annamayya",
            "state": "Andhra Pradesh",
            "desc": "Organically certified GI-tagged Banganapalli mangoes. Naturally carbide-free ripened, high brix sweetness.",
            "images": ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=800"]
        },
        {
            "farmer": farmers[0],
            "cat": categories["spices"],
            "crop_name": "Fresh Green Chillies",
            "variety": "G-4 Bullet",
            "total_quantity": 1200,
            "available_quantity": 1200,
            "unit": "kg",
            "asking_price": 38.0,
            "min_acceptable": 32.0,
            "harvest_date": today,
            "available_until": today + timedelta(days=10),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Madanapalle",
            "district": "Annamayya",
            "state": "Andhra Pradesh",
            "desc": "Spicy green chillies, crisp stems, freshly plucked for wholesale market distribution.",
            "images": ["https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800"]
        },

        # Farmer 1 (Venkat Rao - Miryalaguda)
        {
            "farmer": farmers[1],
            "cat": categories["grains-cereals"],
            "crop_name": "Sona Masoori Raw Paddy",
            "variety": "BPT-5204 Super Fine",
            "total_quantity": 15000,
            "available_quantity": 10000,
            "unit": "kg",
            "asking_price": 26.5,
            "min_acceptable": 23.5,
            "harvest_date": today - timedelta(days=7),
            "available_until": today + timedelta(days=60),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Miryalaguda",
            "district": "Nalgonda",
            "state": "Telangana",
            "desc": "Aromatic fine grain Sona Masoori paddy. Moisture content below 13%, zero foreign seeds, stored in clean jute bags.",
            "images": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800"]
        },
        {
            "farmer": farmers[1],
            "cat": categories["pulses"],
            "crop_name": "Red Gram (Toor Dal Whole)",
            "variety": "Latha-WRG-65",
            "total_quantity": 3500,
            "available_quantity": 3500,
            "unit": "kg",
            "asking_price": 85.0,
            "min_acceptable": 76.0,
            "harvest_date": today - timedelta(days=10),
            "available_until": today + timedelta(days=90),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Miryalaguda",
            "district": "Nalgonda",
            "state": "Telangana",
            "desc": "Clean sun-dried whole red gram for dal millers and food processing companies. High protein yield.",
            "images": ["https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800"]
        },
        {
            "farmer": farmers[1],
            "cat": categories["grains-cereals"],
            "crop_name": "Yellow Maize (Corn)",
            "variety": "Pioneer Hybrid",
            "total_quantity": 8000,
            "available_quantity": 8000,
            "unit": "kg",
            "asking_price": 21.0,
            "min_acceptable": 18.5,
            "harvest_date": today - timedelta(days=5),
            "available_until": today + timedelta(days=45),
            "quality_grade": "Grade B",
            "delivery_options": "pickup_only",
            "village": "Miryalaguda",
            "district": "Nalgonda",
            "state": "Telangana",
            "desc": "Clean dry maize suitable for poultry feed manufacturers and starch processing units.",
            "images": ["https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800"]
        },

        # Farmer 2 (Lakshmi Narayana - West Godavari)
        {
            "farmer": farmers[2],
            "cat": categories["vegetables"],
            "crop_name": "Nashik Quality Red Onions",
            "variety": "Bhima Super Red",
            "total_quantity": 5000,
            "available_quantity": 3800,
            "unit": "kg",
            "asking_price": 28.0,
            "min_acceptable": 23.0,
            "harvest_date": today - timedelta(days=4),
            "available_until": today + timedelta(days=25),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Tadepalligudem",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "desc": "Medium to large size cured onions in ventilated mesh bags (50kg bags). Low neck thickness, long storage life.",
            "images": ["https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800"]
        },
        {
            "farmer": farmers[2],
            "cat": categories["fruits"],
            "crop_name": "Grand Naine Bananas",
            "variety": "G-9 Robusta",
            "total_quantity": 6000,
            "available_quantity": 6000,
            "unit": "kg",
            "asking_price": 16.0,
            "min_acceptable": 13.0,
            "harvest_date": today,
            "available_until": today + timedelta(days=7),
            "quality_grade": "Grade A",
            "delivery_options": "pickup_only",
            "village": "Tadepalligudem",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "desc": "Green mature banana bunches directly harvested from fertile Godavari delta soil. High bunch weight.",
            "images": ["https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800"]
        },
        {
            "farmer": farmers[2],
            "cat": categories["grains-cereals"],
            "crop_name": "Navara Ayurvedic Red Rice",
            "variety": "Heritage Medicinal",
            "total_quantity": 1800,
            "available_quantity": 1800,
            "unit": "kg",
            "asking_price": 95.0,
            "min_acceptable": 82.0,
            "harvest_date": today - timedelta(days=8),
            "available_until": today + timedelta(days=120),
            "quality_grade": "Organic Premium",
            "delivery_options": "both",
            "village": "Tadepalligudem",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "desc": "Nutrient rich unpolished organic red rice. Highly demanded by organic stores and wellness brands.",
            "images": ["https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800"]
        },

        # Farmer 3 (Mallesh Goud - Shamshabad)
        {
            "farmer": farmers[3],
            "cat": categories["vegetables"],
            "crop_name": "Fresh Tender Okra (Lady Finger)",
            "variety": "Radhika Hybrid",
            "total_quantity": 800,
            "available_quantity": 800,
            "unit": "kg",
            "asking_price": 32.0,
            "min_acceptable": 27.0,
            "harvest_date": today,
            "available_until": today + timedelta(days=5),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Shamshabad",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "desc": "Tender deep-green okra, morning harvest. Zero pest marks, quick delivery available to Hyderabad city.",
            "images": ["https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800"]
        },
        {
            "farmer": farmers[3],
            "cat": categories["vegetables"],
            "crop_name": "Purple Striped Brinjal (Eggplant)",
            "variety": "Ravaiya Round",
            "total_quantity": 1200,
            "available_quantity": 1200,
            "unit": "kg",
            "asking_price": 24.0,
            "min_acceptable": 19.0,
            "harvest_date": today - timedelta(days=1),
            "available_until": today + timedelta(days=6),
            "quality_grade": "Grade A",
            "delivery_options": "delivery_available",
            "village": "Shamshabad",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "desc": "Glossy round brinjals suitable for stuffing and hospitality kitchens. No pesticide residue.",
            "images": ["https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800"]
        },
        {
            "farmer": farmers[3],
            "cat": categories["vegetables"],
            "crop_name": "Organic Spinach & Mint Leaves",
            "variety": "Palak & Pudina",
            "total_quantity": 500,
            "available_quantity": 500,
            "unit": "kg",
            "asking_price": 40.0,
            "min_acceptable": 34.0,
            "harvest_date": today,
            "available_until": today + timedelta(days=3),
            "quality_grade": "Organic Premium",
            "delivery_options": "both",
            "village": "Shamshabad",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "desc": "Farm fresh bunches bundled with biodegradable twine. Hydrated and crated.",
            "images": ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800"]
        },

        # Farmer 4 (Subba Rao - Tenali)
        {
            "farmer": farmers[4],
            "cat": categories["spices"],
            "crop_name": "Guntur Teja Dry Red Chilli",
            "variety": "Teja S-17",
            "total_quantity": 3000,
            "available_quantity": 2200,
            "unit": "kg",
            "asking_price": 195.0,
            "min_acceptable": 178.0,
            "harvest_date": today - timedelta(days=15),
            "available_until": today + timedelta(days=180),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Tenali",
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "desc": "World famous Guntur Teja hot red chillies. High capsaicin SHU value, deep red color, moisture 9%. Standard gunny bags.",
            "images": ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"]
        },
        {
            "farmer": farmers[4],
            "cat": categories["spices"],
            "crop_name": "Salem Variety Turmeric Fingers",
            "variety": "Prathibha High Curcumin",
            "total_quantity": 2500,
            "available_quantity": 2500,
            "unit": "kg",
            "asking_price": 140.0,
            "min_acceptable": 125.0,
            "harvest_date": today - timedelta(days=20),
            "available_until": today + timedelta(days=240),
            "quality_grade": "Organic Premium",
            "delivery_options": "both",
            "village": "Tenali",
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "desc": "Polished turmeric fingers with verified curcumin above 5.2%. Ideal for pharmaceutical and spice extraction units.",
            "images": ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800"]
        },
        {
            "farmer": farmers[4],
            "cat": categories["pulses"],
            "crop_name": "Black Gram (Urad Whole)",
            "variety": "LBG-752",
            "total_quantity": 4000,
            "available_quantity": 4000,
            "unit": "kg",
            "asking_price": 92.0,
            "min_acceptable": 82.0,
            "harvest_date": today - timedelta(days=12),
            "available_until": today + timedelta(days=150),
            "quality_grade": "Grade A",
            "delivery_options": "both",
            "village": "Tenali",
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "desc": "Bold black gram grains for idli batter and papad manufacturing. Machine cleaned and destoned.",
            "images": ["https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800"]
        }
    ]

    listings = []
    for p in produce_seed:
        listing = ProduceListing(
            farmer_id=p["farmer"].id,
            category_id=p["cat"].id,
            crop_name=p["crop_name"],
            variety=p["variety"],
            total_quantity=p["total_quantity"],
            available_quantity=p["available_quantity"],
            unit=p["unit"],
            asking_price_per_unit=p["asking_price"],
            min_acceptable_price=p["min_acceptable"], # Strictly secret
            harvest_date=p["harvest_date"],
            available_until=p["available_until"],
            quality_grade=p["quality_grade"],
            description=p["desc"],
            village=p["village"],
            district=p["district"],
            state=p["state"],
            delivery_options=p["delivery_options"],
            status="active" if p["available_quantity"] == p["total_quantity"] else "partially_sold"
        )
        db.add(listing)
        db.flush()

        for idx, img_url in enumerate(p["images"]):
            img = ProduceImage(
                produce_id=listing.id,
                image_url=img_url,
                is_primary=(idx == 0),
                caption=f"{p['crop_name']} Fresh Harvest"
            )
            db.add(img)

        listings.append(listing)

    # 6. 10 Sample Offers Demonstrating Real Negotiation & Partial Quantities
    # Offers on Listing 0 (Tomatoes):
    # Buyer 0 (Suresh Agarwal) offered 500 kg @ ₹15
    offer1 = BuyerOffer(
        produce_id=listings[0].id,
        buyer_id=buyers[0].id,
        requested_quantity=500,
        offered_price_per_unit=15.0,
        total_offer_value=7500.0,
        preferred_delivery_date=today + timedelta(days=3),
        delivery_method="Buyer Pickup",
        additional_requirements="Please ensure 25 kg standard plastic crates",
        status="pending"
    )
    db.add(offer1)
    db.flush()
    db.add(OfferNegotiation(
        offer_id=offer1.id,
        sender_id=buyers[0].id,
        counter_price_per_unit=15.0,
        counter_quantity=500,
        message="Can pick up tomorrow morning from farm gate if price ₹15/kg is agreeable.",
        status="proposed"
    ))

    # Buyer 1 (FreshBasket) offered 500 kg @ ₹16 (Countered to ₹17)
    offer2 = BuyerOffer(
        produce_id=listings[0].id,
        buyer_id=buyers[1].id,
        requested_quantity=500,
        offered_price_per_unit=16.0,
        total_offer_value=8000.0,
        preferred_delivery_date=today + timedelta(days=2),
        delivery_method="Farmer Delivery",
        additional_requirements="Need direct dispatch to FreshBasket Shamshabad Hub",
        status="countered",
        current_agreed_price=17.0,
        current_agreed_quantity=500
    )
    db.add(offer2)
    db.flush()
    db.add(OfferNegotiation(
        offer_id=offer2.id,
        sender_id=buyers[1].id,
        counter_price_per_unit=16.0,
        counter_quantity=500,
        message="Ready to purchase 500 kg at ₹16/kg with delivery.",
        status="proposed"
    ))
    db.add(OfferNegotiation(
        offer_id=offer2.id,
        sender_id=farmers[0].id,
        counter_price_per_unit=17.0,
        counter_quantity=500,
        message="Transportation to Shamshabad costs ₹1/kg. Can deliver at ₹17/kg.",
        status="proposed"
    ))

    # Buyer 2 (Grand Horizon Hotels) purchased 1000 kg @ ₹16.5 -> Converted to confirmed Order!
    offer3 = BuyerOffer(
        produce_id=listings[0].id,
        buyer_id=buyers[2].id,
        requested_quantity=1000,
        offered_price_per_unit=16.5,
        total_offer_value=16500.0,
        preferred_delivery_date=today + timedelta(days=1),
        delivery_method="Farmer Delivery",
        additional_requirements="Grade A uniform size for hotel banquets",
        status="converted_to_order",
        current_agreed_price=16.5,
        current_agreed_quantity=1000
    )
    db.add(offer3)
    db.flush()

    # 7. Sample Orders demonstrating full lifecycle & Weighment Verification
    # Order 1: From offer 3 (Tomatoes) - Completed with Digital Weighment & Payment
    order1 = Order(
        order_number="RD-20261120-TM001",
        offer_id=offer3.id,
        produce_id=listings[0].id,
        farmer_id=farmers[0].id,
        buyer_id=buyers[2].id,
        quantity=1000,
        agreed_price_per_unit=16.5,
        initial_total_amount=16500.0,
        final_payable_amount=16335.0, # (990 accepted kg * 16.5)
        delivery_method="Farmer Delivery",
        delivery_address="Grand Horizon Banquet Central Kitchen, Banjara Hills, Hyderabad",
        estimated_delivery_date=today - timedelta(days=1),
        status="completed",
        payment_status="fully_paid",
        advance_amount_paid=16335.0,
        status_notes="Order delivered, weighment verified and paid in full"
    )
    db.add(order1)
    db.flush()

    # Digital Weighment Record for Order 1
    # Gross: 1040 kg, Packaging (crates): 40 kg -> Net: 1000 kg.
    # Accepted: 990 kg, Rejected: 10 kg (mild transport bruise)
    # Final payable = 990 * 16.5 = ₹16,335.00
    weighment1 = WeighmentRecord(
        order_id=order1.id,
        original_listing_quantity=1000,
        gross_weight=1040.0,
        packaging_weight=40.0,
        net_weight=1000.0,
        accepted_quantity=990.0,
        rejected_quantity=10.0,
        rejection_reason="10 kg damaged due to transit compression on bottom crates",
        agreed_price=16.5,
        calculated_final_amount=16335.0,
        scale_type="Certified APMC Electronic Platform Scale (Sl. No. TS-MND-4412)",
        weighment_slip_photo_url="https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600",
        produce_photo_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600",
        farmer_confirmed=True,
        farmer_confirmed_at=datetime.utcnow() - timedelta(hours=20),
        buyer_confirmed=True,
        buyer_confirmed_at=datetime.utcnow() - timedelta(hours=22),
        verification_timestamp=datetime.utcnow() - timedelta(hours=20)
    )
    db.add(weighment1)

    # Quality assessment for Order 1
    qa1 = QualityAssessment(
        order_id=order1.id,
        assessed_by="Chef Anand Varma (Joint Inspection)",
        grade="Grade A",
        moisture_content_pct=88.5,
        foreign_matter_pct=0.0,
        damage_rot_pct=1.0,
        notes="High quality firm tomatoes, excellent color and freshness."
    )
    db.add(qa1)

    # Payment Transaction for Order 1
    pay1 = PaymentTransaction(
        order_id=order1.id,
        payer_id=buyers[2].id,
        payee_id=farmers[0].id,
        amount=16335.0,
        payment_stage="full",
        payment_method="upi",
        transaction_reference="RD-TXN-20261120-008129",
        receipt_number="RCP-20261120-7712",
        is_demo=True,
        demo_badge_text="DEMO SIMULATION",
        status="completed",
        notes="Settlement paid via UPI / Escrow confirmation",
        confirmed_at=datetime.utcnow() - timedelta(hours=19)
    )
    db.add(pay1)

    # Order 2: Paddy (Venkat Rao -> Suresh Agarwal) - In Transit
    order2 = Order(
        order_number="RD-20261121-PD002",
        produce_id=listings[3].id,
        farmer_id=farmers[1].id,
        buyer_id=buyers[0].id,
        quantity=5000,
        agreed_price_per_unit=26.0,
        initial_total_amount=130000.0,
        final_payable_amount=130000.0,
        delivery_method="Buyer Pickup",
        delivery_address="Begum Bazar Wholesale Godown 4, Hyderabad",
        estimated_delivery_date=today + timedelta(days=1),
        status="in_transit",
        payment_status="advance_paid",
        advance_amount_paid=30000.0,
        status_notes="Truck loaded at Miryalaguda farm gate; in transit to Begum Bazar."
    )
    db.add(order2)
    db.flush()

    pay2 = PaymentTransaction(
        order_id=order2.id,
        payer_id=buyers[0].id,
        payee_id=farmers[1].id,
        amount=30000.0,
        payment_stage="advance",
        payment_method="bank_transfer",
        transaction_reference="RD-TXN-20261121-009941",
        receipt_number="RCP-20261121-8841",
        is_demo=True,
        demo_badge_text="DEMO SIMULATION",
        status="completed",
        notes="Advance token transfer for dispatch confirmation",
        confirmed_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(pay2)

    # 8. 15 Mandi Bhav Market Prices across AP and Telangana markets
    mandi_records = [
        {"crop": "Tomatoes", "var": "Hybrid Sahu", "mandi": "Madanapalle APMC Yard", "dist": "Annamayya", "min": 1200, "max": 2000, "modal": 1650},
        {"crop": "Tomatoes", "var": "Local Country", "mandi": "Bowenpally Market Yard", "dist": "Hyderabad", "min": 1400, "max": 2200, "modal": 1800},
        {"crop": "Tomatoes", "var": "Hybrid Red", "mandi": "Kothapet Fruit & Veg Market", "dist": "Ranga Reddy", "min": 1350, "max": 2100, "modal": 1750},
        {"crop": "Onions", "var": "Red Nasik Quality", "mandi": "Malakpet Onion Yard", "dist": "Hyderabad", "min": 2200, "max": 2900, "modal": 2600},
        {"crop": "Onions", "var": "Local Red", "mandi": "Tadepalligudem APMC", "dist": "West Godavari", "min": 2100, "max": 2750, "modal": 2450},
        {"crop": "Sona Masoori Paddy", "var": "BPT-5204", "mandi": "Miryalaguda APMC Yard", "dist": "Nalgonda", "min": 2400, "max": 2750, "modal": 2620},
        {"crop": "Sona Masoori Paddy", "var": "BPT-5204", "mandi": "Nandyal Market Committee", "dist": "Nandyal", "min": 2350, "max": 2680, "modal": 2550},
        {"crop": "Red Chillies (Dry)", "var": "Teja S-17", "mandi": "Guntur Mirchi Yard", "dist": "Guntur", "min": 17500, "max": 21500, "modal": 19600},
        {"crop": "Red Chillies (Dry)", "var": "334 / S-4", "mandi": "Khammam APMC Yard", "dist": "Khammam", "min": 16000, "max": 19500, "modal": 18200},
        {"crop": "Turmeric Fingers", "var": "Salem Quality", "mandi": "Duggirala Turmeric Yard", "dist": "Guntur", "min": 12500, "max": 15200, "modal": 13900},
        {"crop": "Turmeric Fingers", "var": "Nizamabad Double Polish", "mandi": "Nizamabad APMC", "dist": "Nizamabad", "min": 13000, "max": 16000, "modal": 14500},
        {"crop": "Banganapalli Mangoes", "var": "GI Grade A", "mandi": "Nunna Mango Yard", "dist": "NTR / Vijayawada", "min": 6000, "max": 8500, "modal": 7200},
        {"crop": "Green Chillies", "var": "Bullet G-4", "mandi": "Gudivada Mandi", "dist": "Krishna", "min": 3000, "max": 4200, "modal": 3600},
        {"crop": "Red Gram (Toor)", "var": "Whole Dry", "mandi": "Tandur APMC (GI Region)", "dist": "Vikarabad", "min": 7800, "max": 8900, "modal": 8450},
        {"crop": "Yellow Maize", "var": "Hybrid Dry", "mandi": "Warangal APMC Enugula Gadda", "dist": "Warangal", "min": 1900, "max": 2250, "modal": 2100},
    ]

    for m in mandi_records:
        mp = MarketPrice(
            crop_name=m["crop"],
            variety=m["var"],
            market_name=m["mandi"],
            district=m["dist"],
            state="Andhra Pradesh / Telangana",
            min_price=m["min"],
            max_price=m["max"],
            modal_price=m["modal"],
            unit="quintal",
            observation_date=today,
            source="Agmarknet / APMC Daily Market Bulletin",
            is_sample_data=True,
            data_label="OFFICIAL APMC MANDI RECORD (DAILY)"
        )
        db.add(mp)

    # 9. Initial Notifications
    notifs = [
        Notification(
            user_id=farmers[0].id,
            type="offer",
            title="New Offer Received for Tomatoes",
            message="Suresh Agarwal submitted an offer for 500 kg at ₹15.00/kg.",
            reference_type="offer",
            reference_id=offer1.id,
            is_read=False
        ),
        Notification(
            user_id=buyers[2].id,
            type="order",
            title="Order #RD-20261120-TM001 Completed",
            message="Payment confirmed and weighment verified. Thank you for buying direct from Rami Reddy!",
            reference_type="order",
            reference_id=order1.id,
            is_read=True
        )
    ]
    for n in notifs:
        db.add(n)

    db.commit()
    print("✅ Seed data populated successfully! Test credentials:")
    print("   Farmer: 9876543210 / Farmer@123")
    print("   Buyer:  9876543220 / Buyer@123")
    print("   Admin:  9876543200 / Admin@123")
