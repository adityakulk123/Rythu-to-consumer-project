# RythuDirect – Smart Farmer-to-Buyer Agricultural Marketplace

> **Tagline:** Fair Prices. Direct Buyers. Better Farming.

**RythuDirect** is a modern, responsive, full-stack B2B and B2C agricultural technology platform engineered to connect smallholder and commercial farmers directly with verified buyers—including wholesalers, supermarkets, food processing enterprises, restaurants, and institutional buyers—bypassing predatory middlemen.

---

## 🌾 Key Real-World Agricultural Problems Solved

1. **Low Farmer Bargaining Power:** Farmers can set asking prices and specify a **confidential minimum acceptable price** that buyers cannot see, safeguarding bargaining power.
2. **Heavy Middleman Intermediation:** Direct communication and multi-quotation management directly between farmers and verified buyers.
3. **Unfair Quality & Tare Deductions:** Digital **Weighment & Quality Slip** logs Gross Weight, Packaging Tare Weight, and Certified Scale Slips ($Net\ Weight = Gross - Tare$, $Final\ Amount = Accepted\ Net \times Agreed\ Price$). Mutually confirmed by both parties and locked against tampering.
4. **Delayed Payments:** Integrated **Escrow Milestone System** (20% Advance holding, Full payout on delivery) with APMC and GST compliant digital receipts.
5. **Lack of Transparent Market Information:** Cross-mandi benchmark feeds showing Min, Max, and Modal prices across APMC mandis (Bowenpally, Warangal, Guntur, Nizamabad, Suryapet, Kurnool) from official sources.
6. **Multi-Buyer Splitting & Inventory Safety:** Atomic database row-locking prevents overselling when multiple buyers submit quotations for the same harvest lot.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js 19** with **Vite**
- **Tailwind CSS v4** (Agricultural fintech palette: Forest Green `#1B4332`, Leaf Green `#2D6A4F`, Soft Yellow `#E9C46A`, Crisp Off-White `#F8F9FA`)
- **React Router DOM v7**
- **Axios** (with JWT Bearer interceptors)
- **Lucide React Icons**
- **Bilingual i18n:** Full **English** and **Telugu (తెలుగు)** support with an instant switcher.

### **Backend**
- **Python 3.14 / 3.15** with **FastAPI**
- **Uvicorn** ASGI server
- **SQLAlchemy 2.0 ORM** & **Pydantic v2**
- **Alembic** database migrations
- **PostgreSQL / Neon & SQLite** dual-compatible architecture
- **JWT Authentication & Bcrypt Password Hashing**
- **Role-Based Access Control (RBAC)**: `FARMER`, `BUYER`, `ADMIN` (Public registration strictly bars unauthorized admin creation)

---

## 📁 Repository Structure

```
rythudirect/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, LanguageSwitcher, Modals (Weighment, MakeOffer, Payment, Dispute)
│   │   ├── context/          # AuthContext, LanguageContext
│   │   ├── layouts/          # MainLayout, DashboardLayout
│   │   ├── pages/            # LandingPage, ExploreProducePage, ProduceDetailPage, MarketPricesPage, Login, Register
│   │   │   ├── farmer/       # FarmerDashboard, AddProducePage, FarmerProduceList, FarmerOffersPage, FarmerOrdersPage, FarmerPaymentsPage
│   │   │   ├── buyer/        # BuyerDashboard, BuyerOffersPage, BuyerOrdersPage
│   │   │   └── admin/        # AdminDashboard (Governance, Dispute Arbitration, Verification)
│   │   ├── services/         # api.js (Axios instance with JWT interceptors)
│   │   ├── translations/     # en.js, te.js (Telugu)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Modular endpoints: auth, farmer, buyer, orders, payments, market_prices, admin, notifications, disputes
│   │   ├── core/             # config.py, database.py, security.py (bcrypt & JWT)
│   │   ├── models/           # 18 normalized SQLAlchemy models
│   │   ├── schemas/          # Pydantic v2 request/response schemas
│   │   ├── services/         # Core business logic: atomic negotiation, inventory lock, weighment math, escrow
│   │   ├── utils/            # seed_data.py (5 farmers, 5 buyers, 15 produce listings, 10 offers, orders, mandi prices)
│   │   └── main.py           # FastAPI entrypoint with CORS & auto-seed
│   ├── alembic/              # Database migration versions
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/                # Automated pytest suite
└── README.md
```

---

## 🚀 Quickstart & Setup Instructions

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+ (or Python 3.14/3.15)

---

### 2. Backend Setup

```bash
cd rythudirect/backend

# 1. Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Environment configuration
cp .env.example .env

# 4. Run database migrations (or auto-created on startup)
alembic upgrade head

# 5. Start the FastAPI backend
uvicorn app.main:app --reload --port 8000
```
The backend API is now running at `http://localhost:8000`.
- Interactive Swagger API Documentation: `http://localhost:8000/api/v1/docs`
- Alternative ReDoc Documentation: `http://localhost:8000/api/v1/redoc`

---

### 3. Frontend Setup

```bash
cd rythudirect/frontend

# 1. Install packages
npm install

# 2. Start Vite development server
npm run dev
```
The React frontend is now accessible at `http://localhost:5173`.

---

## 🔑 Pre-Configured Test Credentials

For quick evaluation, the database comes pre-seeded with verified test accounts across all roles:

| Role | Mobile / Identifier | Password | Description |
|---|---|---|---|
| **Farmer** | `9848011111` | `farmer123` | Mallaiah Yadav (Jangaon, Paddy & Tomato Farmer) |
| **Farmer** | `9848022222` | `farmer123` | Rami Reddy (Guntur, Teja Chilli & Cotton) |
| **Buyer** | `9700011111` | `buyer123` | Vikram Sethi (Sethi Agro Wholesalers, Bowenpally APMC) |
| **Buyer** | `9700022222` | `buyer123` | Suresh Chandra (FreshRoots Supermarket Chain) |
| **Admin** | `9999999999` | `admin123` | Platform Governance Administrator |

*Note: In the Login screen, click any of the one-click demo role buttons ("Farmer", "Buyer", "Admin") to instantly pre-fill credentials.*

---

## 🧪 Running Automated Backend Tests

```bash
cd rythudirect/backend
.\venv\Scripts\python -m pytest -v tests/test_marketplace.py
```

### Verified Test Cases:
- `test_health_check`: Verifies system uptime and API v1 status.
- `test_prevent_admin_public_registration`: Asserts ordinary users cannot register as Admin via public endpoints.
- `test_farmer_and_buyer_auth_flow`:
  - Registers farmer and buyer.
  - Generates produce listing with asking price and private reserve minimum price.
  - Verifies buyer browsing strips/masks private minimum reserve.
  - Submits purchase offer.
  - Farmer accepts offer: verifies atomic stock reduction (`1000kg - 400kg = 600kg remaining`) and status transition to `PARTIALLY_SOLD`.
  - Prevents over-selling: rejects subsequent offers exceeding remaining stock.
  - Verifies certified weighment math ($Net = Gross - Tare$, $Final = Accepted \times Price$).
  - Mutual confirmation locking.
  - Escrow payment status update and receipt issuance.
  - Dispute reporting.

---

## ⚖️ Database Schema (18 Normalized Tables)

1. `users`
2. `farmer_profiles`
3. `buyer_profiles`
4. `buyer_verifications`
5. `crop_categories`
6. `produce_listings`
7. `produce_images`
8. `buyer_offers`
9. `offer_negotiations`
10. `orders`
11. `order_items`
12. `weighment_records`
13. `quality_assessments`
14. `payment_transactions`
15. `notifications`
16. `disputes`
17. `market_prices`
18. `audit_logs`

---

## 🌐 Production & Neon PostgreSQL Deployment

To deploy with **Neon PostgreSQL**:
1. Create a project in [Neon Console](https://neon.tech).
2. Set `DATABASE_URL` in `rythudirect/backend/.env`:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<endpoint-pooler>.neon.tech/rythudirect?sslmode=require"
   ```
3. Run `alembic upgrade head`.
4. Deploy FastAPI with Uvicorn or Docker container, and deploy React build (`npm run build`) to Vercel, Netlify, or Cloudflare Pages.
