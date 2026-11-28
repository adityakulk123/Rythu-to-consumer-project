# RythuDirect (రైతు డైరెక్ట్)
### Smart Farmer-to-Buyer Agricultural Marketplace & Fintech Platform

> **Fair Prices. Direct Buyers. Better Farming.**  
> *రైతుకు న్యాయమైన ధర &bull; దళారులు లేని నేరుగా అమ్మకాలు &bull; ఆధునిక వ్యవసాయ వేదిక*

[![Python](https://img.shields.io/badge/Python-3.14%20%7C%203.15-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL_17-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/Platform-Production_Ready-10B981)](#)

---

**RythuDirect** is a modern full-stack agricultural fintech marketplace connecting Indian smallholder and commercial farmers directly with verified institutional and bulk commercial buyers (wholesalers, supermarkets, food processors, hotels, restaurants, and retail chains)—permanently bypassing exploitative commission agents (*dalalis*) and middlemen.

---

## 🏛️ System Architecture

![RythuDirect System Architecture](docs/images/architecture_diagram.png)

### 3-Tier Layered Overview

| Architecture Tier | Technologies & Components | Core Responsibilities |
|---|---|---|
| **Presentation Tier (Client SPA)** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios, Context API | Mobile-responsive SPA, instant **English & Telugu (తెలుగు)** bilingual switcher, role-based dashboards (Farmer, Buyer, Admin), JWT Bearer client interceptors. |
| **API Gateway & Routing** | Cloudflare Tunnel / SSL Reverse Proxy, CORS Middleware | Secure ingress, origin protection, public demo tunneling, and API route dispatching. |
| **Application Services (Backend)** | Python FastAPI, Uvicorn ASGI, Pydantic v2, PyJWT, Bcrypt, OAuth2 | Asynchronous REST endpoints (`/auth`, `/farmer`, `/buyer`, `/orders`, `/weighments`, `/payments`, `/market-prices`, `/admin`, `/activity`), atomic stock locking, Rule 13 floor price secrecy, digital scale weighment math. |
| **Persistence Tier (Database)** | **Supabase Cloud PostgreSQL 17.12**, Session Pooler (port `5432`), SQLAlchemy 2.0 ORM, `psycopg` (v3) | 19 normalized relational tables, ACID transactional safety, row-level locking, sequence auto-increments, and foreign key integrity. |

---

## 🗄️ Relational Entity-Relationship Diagram (ERD)

![RythuDirect Entity Relationship Diagram](docs/images/er_diagram.png)

### 19 Normalized Relational Tables by Domain

```mermaid
erDiagram
    users ||--o| farmer_profiles : "has"
    users ||--o| buyer_profiles : "has"
    buyer_profiles ||--o| buyer_verifications : "submits"
    crop_categories ||--o{ produce_listings : "categorizes"
    farmer_profiles ||--o{ produce_listings : "lists"
    produce_listings ||--o{ produce_images : "contains"
    produce_listings ||--o{ buyer_offers : "receives"
    buyer_profiles ||--o{ buyer_offers : "places"
    buyer_offers ||--o{ offer_negotiations : "threads"
    buyer_offers ||--|| orders : "converts_to"
    farmer_profiles ||--o{ orders : "fulfills"
    buyer_profiles ||--o{ orders : "purchases"
    orders ||--o{ order_items : "contains"
    produce_listings ||--o{ order_items : "itemizes"
    orders ||--|| weighment_records : "weighs"
    weighment_records ||--|| quality_assessments : "grades"
    orders ||--o{ payment_transactions : "settles"
    orders ||--o{ disputes : "flags"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "audits"
    users ||--o{ user_activity_logs : "tracks"
```

1. **Identity & Access:** `users`, `farmer_profiles`, `buyer_profiles`, `buyer_verifications`
2. **Produce Catalog:** `crop_categories`, `produce_listings`, `produce_images`
3. **Bidding & Negotiation:** `buyer_offers`, `offer_negotiations`
4. **Orders & Inventory:** `orders`, `order_items`
5. **Certified Weighment:** `weighment_records`, `quality_assessments`
6. **Financials & Disputes:** `payment_transactions`, `disputes`
7. **Intelligence & Telemetry:** `market_prices`, `notifications`, `audit_logs`, `user_activity_logs`

---

## 🌟 Real-World Agricultural Problems Solved

### 1. Confidential Floor Pricing (Rule 13 Invariant)
Farmers set a public **Asking Price** and a secret **Minimum Acceptable Price**. The API strictly filters serialization:
- Public and buyer endpoints use `ProducePublicResponse`, which permanently redacts `min_acceptable_price`.
- Only the farmer who owns the listing can view their private reserve price via `ProduceFarmerResponse`.

### 2. Multi-Buyer Bidding & Atomic Inventory Locking (Section 12)
- Multi-buyer bidding is supported for partial quantities of a harvest lot.
- Upon offer acceptance, the system executes an atomic transaction:
  $$\text{Remaining Quantity} = \text{Total Quantity} - \text{Accepted Quantity}$$
- If stock hits zero, status transitions to `SOLD_OUT`; otherwise `PARTIALLY_SOLD`.
- Over-allocation attempts exceeding remaining inventory are automatically rejected with HTTP 400.

### 3. Certified Digital Scale Weighment (Section 14)
Eliminates arbitrary mandi deductions and unverified moisture cuts with certified scale slips:
$$\text{Net Weight} = \text{Gross Weight} - \text{Packaging Tare Weight}$$
$$\text{Final Settlement Amount} = \text{Accepted Net Quantity} \times \text{Agreed Price}$$
- Dual-party mutual confirmation: both Farmer and Buyer must digitally approve the certified weighment slip before escrow disbursement.

### 4. 2-Phase Escrow Settlement (Section 15)
- **Phase 1 (Advance Milestone):** 20% advance payment locked in escrow upon offer agreement.
- **Phase 2 (Final Settlement):** 80% balance released upon mutual confirmation of digital scale slips.
- Generates downloadable and printable APMC/GST-compliant transaction receipts.

### 5. APMC Mandi Bhav Market Intelligence (Section 16)
- Daily live modal, minimum, and maximum price feeds across Telangana and Andhra Pradesh mandis (Bowenpally, Guntur, Warangal, Nizamabad, Suryapet, Kurnool).
- Features an interactive cross-mandi price spread analysis tool.

### 6. Full Bilingual Accessibility (Section 8)
- Instant one-click toggle between **English** and **Telugu (తెలుగు)** with zero page reloads.

---

## ⚡ Active Database: Supabase Cloud PostgreSQL 17

The application's active database is hosted on **Supabase Cloud PostgreSQL 17.12**:
- **Host Region:** Tokyo (`aws-1-ap-northeast-1`)
- **Connection Mode:** IPv4 Session Connection Pooler (port `5432`)
- **Driver:** `postgresql+psycopg` (modern psycopg v3)
- **Status:** 100% migrated from legacy Neon with zero remaining Neon dependencies.

```env
DATABASE_URL="postgresql+psycopg://postgres.vdtfhjorxudmwwqotkqw:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
SUPABASE_URL="https://vdtfhjorxudmwwqotkqw.supabase.co"
SUPABASE_PROJECT_ID="vdtfhjorxudmwwqotkqw"
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python** 3.10+ (tested on Python 3.14 & 3.15)
- **Node.js** 18+ (tested on Node v22.13.1)
- **npm** 9+

---

### 1. Automated One-Click Start (Windows)
```powershell
cd rythudirect
.\start_all.bat
```

---

### 2. Manual Backend Startup

```powershell
# Navigate to backend directory
cd rythudirect\backend

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start FastAPI ASGI server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API Root:** `http://localhost:8000`
- **Swagger Interactive API Docs:** `http://localhost:8000/api/v1/docs`
- **ReDoc Interactive Documentation:** `http://localhost:8000/api/v1/redoc`

---

### 3. Manual Frontend Startup

```powershell
# In a new terminal, navigate to frontend directory
cd rythudirect\frontend

# Install dependencies
npm install

# Start Vite dev server
npx vite
```
- **Frontend Web Application:** `http://localhost:5173`

---

## 🔑 Pre-Configured Demo Test Accounts

The Supabase database comes pre-populated with realistic test accounts across all roles:

| Role | Mobile / Identifier | Password | Name & Account Details |
|---|---|---|---|
| 👨‍🌾 **Farmer** | `9848011111` | `farmer123` | Mallaiah Yadav (Jangaon &bull; Paddy, Tomato & Kiwi) |
| 👨‍🌾 **Farmer** | `9848022222` | `farmer123` | Rami Reddy (Guntur &bull; Teja Chilli & Sugarcane) |
| 👨‍🌾 **Farmer** | `9848033333` | `farmer123` | Kavitha Bai (Nizamabad &bull; Turmeric & Soyabean) |
| 🏢 **Buyer** | `9700011111` | `buyer123` | Vikram Sethi (Sethi Agro Wholesalers &bull; APMC Bowenpally) |
| 🏢 **Buyer** | `9700022222` | `buyer123` | Suresh Chandra (FreshRoots Supermarket Chain) |
| 🛡️ **Admin** | `9999999999` | `admin123` | RythuDirect Platform Governance Administrator |

*Tip: On the Login screen, click any demo role badge ("Farmer", "Buyer", "Admin") to instantly populate credentials.*

---

## 🧪 Automated Testing & Verification

RythuDirect contains comprehensive verification suites validating all core business rules:

```powershell
# Run the automated pytest test suite
cd rythudirect\backend
.\venv\Scripts\python.exe -m pytest tests/test_marketplace.py -v

# Run the live Supabase end-to-end verification script
.\venv\Scripts\python.exe verify_api.py
```

### Verified Passing Test Cases:
- [x] **API Health Status (`/health`):** 200 OK healthy response.
- [x] **Role Security & RBAC:** Blocks unauthorized admin creation via public registration.
- [x] **Rule 13 Privacy Invariant:** Strict omission of `min_acceptable_price` in public listings.
- [x] **Multi-Buyer Partial Bidding:** Counter-offers, negotiations, and buyer approvals.
- [x] **Atomic Inventory Lock:** Prevents overselling when multiple buyers purchase from one harvest lot.
- [x] **Certified Weighment Formula:** $Net = Gross - Tare$ calculation verified with scale slip confirmation.
- [x] **Escrow Milestone Settlements:** Advance locking and final payout receipt generation.
- [x] **Administrative Telemetry:** Live activity log write (`user_activity_logs`) and summary aggregation on Supabase.

---

## 📁 Repository Directory Structure

```text
rythudirect/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Modular API routers (auth, farmer, buyer, orders, weighments, payments, mandi, admin)
│   │   ├── core/               # Database engine, session maker, JWT & security configs
│   │   ├── models/             # 19 SQLAlchemy 2.0 normalized models
│   │   ├── schemas/            # Pydantic v2 serialization and validation schemas
│   │   ├── services/           # Domain business logic (negotiation, inventory lock, weighment, escrow)
│   │   ├── utils/              # Seeder with authentic Telangana & AP agricultural data
│   │   └── main.py             # FastAPI entrypoint, CORS, exception handlers
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Automated pytest test suites
│   ├── requirements.txt
│   └── .env                    # Supabase pooler credentials (Git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, LanguageSwitcher, Modals, ScaleSlips
│   │   ├── context/            # AuthContext, LanguageContext
│   │   ├── pages/              # LandingPage, ExploreProducePage, MarketPricesPage, Login, Register
│   │   │   ├── farmer/         # FarmerDashboard, AddProduce, FarmerOffers, Orders, Payments
│   │   │   ├── buyer/          # BuyerDashboard, BuyerOffers, BuyerOrders, ScaleWeighment
│   │   │   └── admin/          # AdminDashboard, KYB Verification, Disputes, ActivityLogs
│   │   ├── services/           # Axios client with JWT interceptors
│   │   ├── translations/       # English (en.js) and Telugu (te.js) dictionaries
│   │   ├── App.jsx             # Protected routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md         # Full architectural specification
│   └── images/
│       ├── architecture_diagram.png # High-res System Architecture Diagram
│       └── er_diagram.png           # High-res Entity-Relationship Diagram (ERD)
├── run_backend.bat             # 1-Click Backend Launcher
├── run_frontend.bat            # 1-Click Frontend Launcher
├── start_all.bat               # 1-Click Unified Full-Stack Launcher
└── README.md
```

---

## 🛡️ Trust, Governance & Fair Trade Principles

- **No Middlemen:** Direct transactions between certified farmers and verified buyers.
- **Strict KYB Verification:** Commercial buyers must upload GST / Trade licenses verified by platform admins.
- **Audit Trails:** Every bid, offer, order status transition, and weighment modification is recorded immutably in `audit_logs`.
- **Fair Scale Protection:** Farmers are protected from arbitrary deductions through certified scale slips with packaging tare subtraction.

---

### 👨‍💻 Developed for Agricultural Innovation & Direct Trade
*Empowering farmers with fair prices, transparent markets, and zero commission intermediaries.*
