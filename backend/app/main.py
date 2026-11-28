import sys
import os

# Ensure backend directory is in sys.path when executed directly
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Automatic interpreter correction: If invoked with an external/system Python lacking fastapi,
# seamlessly hand off execution to the project's virtual environment python.
try:
    import fastapi
except ImportError:
    _possible_venvs = [
        os.path.join(_backend_dir, "venv", "Scripts", "python.exe"),
        os.path.join(os.path.dirname(_backend_dir), "rythudirect", "backend", "venv", "Scripts", "python.exe"),
        os.path.join(os.path.dirname(_backend_dir), "backend", "venv", "Scripts", "python.exe"),
    ]
    for _venv_py in _possible_venvs:
        if os.path.exists(_venv_py) and os.path.abspath(sys.executable).lower() != os.path.abspath(_venv_py).lower():
            import subprocess
            if sys.argv and sys.argv[0] and not sys.argv[0].startswith("-"):
                _cmd = [_venv_py, os.path.abspath(__file__)] + sys.argv[1:]
            else:
                _cmd = [_venv_py, os.path.abspath(__file__)]
            _res = subprocess.run(_cmd)
            sys.exit(_res.returncode)
    raise

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.v1 import api_router
from app.services.seed_data import seed_database
import app.models  # Ensures all models are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RythuDirect: Smart Farmer-to-Buyer Agricultural Marketplace REST API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite frontend & previews
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "RythuDirect API",
        "status": "online",
        "tagline": "Fair Prices. Direct Buyers. Better Farming.",
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
