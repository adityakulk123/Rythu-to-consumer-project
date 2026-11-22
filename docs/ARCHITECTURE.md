# RythuDirect Architectural Specification

## 1. System Overview
**RythuDirect** is a specialized agricultural marketplace and fintech platform designed to eliminate commission agents and predatory intermediaries in Indian agricultural supply chains.

## 2. Key Architecture Layers

### Backend (Python FastAPI)
- **Framework:** FastAPI with asynchronous ASGI execution
- **Database ORM:** SQLAlchemy 2.0 with declarative models
- **Database Support:** Seamless dual support for Neon Serverless PostgreSQL and local SQLite
- **Database Migrations:** Alembic schema migrations
- **Authentication:** OAuth2 password bearer with PyJWT (HMAC-SHA256) and direct Bcrypt salt hashing
- **Security & RBAC:** Explicit role dependencies (`get_current_active_farmer`, `get_current_active_buyer`, `get_current_admin`)

### Frontend (React & Tailwind CSS)
- **Build Tool:** Vite v8
- **Styling:** Tailwind CSS with custom agricultural fintech color scheme
  - Deep Agricultural Green (`#133E2B`)
  - Leaf Green (`#15803D`, `#22C55E`)
  - Crisp Off-White (`#F8FAF6`)
  - Charcoal Text (`#1F2937`)
  - Amber / Soft Gold (`#D97706`)
- **Icons:** Lucide React
- **Internationalization:** Separate translation dictionaries for English (`en`) and Telugu (`te`)

## 3. Core Business Logic & Invariants

### Invariant 1: Farmer Floor Price Confidentiality (Rule 13)
- Farmers enter both an **Asking Price** and a **Private Minimum Acceptable Price**.
- Public and buyer endpoints strictly serialize through `ProducePublicResponse`, which permanently excludes `min_acceptable_price`.
- Only the farmer who owns the listing can view their confidential floor price inside `ProduceFarmerResponse`.

### Invariant 2: Atomicity & Overselling Prevention (Section 12)
- Multi-buyer bidding is supported for partial quantities of a harvest.
- When an offer is accepted, the system checks `requested_qty <= produce.available_quantity`.
- Stock is deducted atomically in a database transaction.
- If quantity reaches 0, status transitions to `sold_out`; otherwise it transitions to `partially_sold`.
- Over-allocation attempts are rejected with HTTP 400.

### Invariant 3: Digital Weighment Verification (Section 14)
- Prevents informal arbitrary deductions at farm gates and mandi yards.
- Net Weight Formula: `Net Weight = Gross Scale Weight - Packaging Tare Weight`
- Final Amount Formula: `Final Payable = Accepted Net Quantity * Agreed Price`
- Both parties (Farmer and Buyer) must digitally confirm the weighment record before final settlement.

### Invariant 4: Audit & Transparency
- All state changes (registrations, offers, counteroffers, orders, weighments, payments, disputes) are recorded in `audit_logs`.
- Simulated transactions in development mode are tagged with `is_demo=True` and clear visual `DEMO` badges.
