@echo off
title RythuDirect Backend API Server
echo ========================================================
echo Starting RythuDirect FastAPI Backend (Neon PostgreSQL)...
echo ========================================================

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

if exist "rythudirect\backend\venv\Scripts\python.exe" (
    echo [OK] Using virtual environment: rythudirect\backend\venv
    cd "rythudirect\backend"
    venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    goto end
)

if exist "backend\venv\Scripts\python.exe" (
    echo [OK] Using virtual environment: backend\venv
    cd "backend"
    venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    goto end
)

if exist "venv\Scripts\python.exe" (
    echo [OK] Using virtual environment: venv
    venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    goto end
)

echo [ERROR] Virtual environment not found!
echo Please create a virtual environment with: py -3 -m venv venv
pause

:end
