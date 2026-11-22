# RythuDirect (రైతు డైరెక్ట్)
### Smart Farmer-to-Buyer Agricultural Marketplace & Fintech Platform

> **Fair Prices. Direct Buyers. Better Farming.**

RythuDirect is a modern full-stack agricultural marketplace connecting Indian farmers directly with commercial buyers (wholesalers, supermarkets, hotels, restaurants, food processors, and bulk retailers) without exploitative commission agents.

---

## 🌟 Key Features

1. **Direct Farmer-to-Buyer Trade:** Eliminates 8-15% commission cuts and arbitrary deductions.
2. **Confidential Floor Pricing (Rule 13):** Farmers specify a private minimum acceptable price that is strictly secret from buyers.
3. **Multi-Buyer Competitive Negotiation (Section 12):** Farmers receive and compare competing bids side-by-side, accept, decline, or counteroffer.
4. **Zero Overselling / Atomic Inventory Locking:** Atomically locks inventory when offers are accepted, allowing partial orders from multiple buyers without exceeding available stock.
5. **Certified Digital Scale Weighment (Section 14):**
   - Formula: `Net Weight = Gross Weight - Packaging Tare Weight`
   - Formula: `Final Settlement = Accepted Net Quantity * Agreed Price`
   - Dual-party mutual confirmation with photo scale receipts.
6. **Payment Settlement & Receipts (Section 15):** Tracks advance, final, and full payments with simulated gateway execution, transaction references, and printable receipts.
7. **APMC Mandi Bhav Intelligence (Section 16):** Live daily price benchmarks across AP and Telangana markets with an inter-mandi price spread comparison tool.
8. **Admin Governance & KYB Verification (Section 17):** Vets commercial buyers, resolves trade disputes, and audits marketplace transactions.
9. **Bilingual Experience (Section 8):** Full instant switcher for English and Telugu (తెలుగు).

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.15)
- Node.js 18+ (tested on Node v22.13.1)
- npm 9+

---

### 1. Backend Setup & Startup

```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment
py -3.15 -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API Swagger Docs will be available at: **http://127.0.0.1:8000/api/v1/docs**

---

### 2. Frontend Setup & Startup

```powershell
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend UI will be live at: **http://127.0.0.1:5173** (or port indicated in terminal)

---

## 🔑 Test Credentials (Pre-seeded Demo Accounts)

Use the 1-Click Quick Login buttons on the login page or manually enter:

| Role | Mobile / Email | Password | Account Details |
|---|---|---|---|
| **Farmer** | `9876543210` | `Farmer@123` | Rami Reddy, Reddy Organic Farms (Madanapalle) |
| **Buyer** | `9876543220` | `Buyer@123` | Suresh Agarwal, Agarwal Wholesale Mandi Traders |
| **Admin** | `9876543200` | `Admin@123` | Platform Administrator, Anti-Middleman Governance |

---

## 🧪 Automated Testing

RythuDirect includes an automated test suite verifying all core requirements:

```powershell
# Run backend tests
.\backend\venv\Scripts\pytest.exe tests/test_api.py -v
```

### Verified Test Cases:
- [x] Health checks and API connectivity
- [x] Farmer, Buyer, and Admin authentication
- [x] **Confidentiality:** Guaranteed exclusion of `min_acceptable_price` in public and buyer responses
- [x] **Inventory Locking:** Rejection of bids exceeding available quantity and atomic stock deduction
- [x] **Weighment Calculation:** `Net = Gross - Tare` and `Final Amount = Accepted Net * Price`
- [x] **Payment Processing:** Demo labeling and receipt generation
- [x] **Admin Dashboard:** Aggregated metrics and user management

---

## 📁 Project Architecture

```text
rythudirect/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, farmer, buyer, orders, payments, mandi, admin)
│   │   ├── core/            # Config, security, JWT, bcrypt
│   │   ├── models/          # SQLAlchemy normalized relational entities
│   │   ├── schemas/         # Pydantic validation & strict serialization schemas
│   │   ├── services/        # Database seeder with realistic Andhra/Telangana sample data
│   │   ├── database/        # Engine, session, and declarative Base
│   │   └── main.py          # FastAPI application entrypoint with CORS
│   ├── alembic/             # Database schema migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client with automatic JWT interceptor
│   │   ├── context/         # AuthContext, LanguageContext, NotificationContext
│   │   ├── i18n/            # English and Telugu translation dictionaries
│   │   ├── components/      # Navbar, Footer, DemoBadge, NotificationDrawer
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── MarketPricesPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── farmer/      # Farmer portal (Produce, Offers, Orders, Weighment, Payments)
│   │   │   ├── buyer/       # Buyer portal (Browse, My Offers, Orders, Scale Weighment, Pay)
│   │   │   └── admin/       # Admin portal (KYB Verification, Disputes, Users, Monitoring)
│   │   ├── App.jsx          # Protected routing hierarchy
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT_NEON_POSTGRES.md
├── tests/
│   └── test_api.py          # Pytest automated test suite (10/10 passing)
└── README.md
```

---

## 🛡️ Trust & Security Features

- **No Middlemen Access:** All negotiations and contracts are direct between verified parties.
- **Strict Role-Based Access Control:** Unauthorized role requests are blocked with HTTP 403.
- **Private Floor Prices:** Stored securely and only visible to the owner farmer.
- **Audit Logging:** Every critical action is preserved in the `audit_logs` table.
- **Transparency Tagging:** All simulated test transactions and mock data carry prominent `DEMO` badges.
