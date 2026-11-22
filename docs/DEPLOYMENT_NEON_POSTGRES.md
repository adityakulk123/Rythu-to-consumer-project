# Deploying RythuDirect to Neon PostgreSQL

RythuDirect is built cloud-ready for Neon Serverless PostgreSQL.

## 1. Create a Neon Project
1. Go to [https://neon.tech](https://neon.tech) and create a free project named `rythudirect`.
2. In the Neon dashboard, navigate to **Dashboard** -> **Connection Details**.
3. Select **SQLAlchemy** or copy the PostgreSQL connection string:
   ```text
   postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
   ```

## 2. Update Backend Configuration
In `backend/.env`:
```env
DATABASE_URL=postgresql+pg8000://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

## 3. Run Migrations on Neon
Execute Alembic migrations to create the normalized relational tables in your Neon cloud database:
```powershell
cd backend
.\venv\Scripts\alembic.exe upgrade head
```

## 4. Seed Cloud Database
Run the automated seed script to populate categories and test credentials:
```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.database.session import SessionLocal; from app.services.seed_data import seed_database; db = SessionLocal(); seed_database(db); db.close()"
```
