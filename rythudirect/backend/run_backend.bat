@echo off
title RythuDirect Backend API Server
echo ========================================================
echo Starting RythuDirect Backend...
echo ========================================================

cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo [ERROR] Virtual environment venv not found in %~dp0
    pause
)
