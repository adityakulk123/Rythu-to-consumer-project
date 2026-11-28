@echo off
title Launch RythuDirect Full Stack
echo ========================================================
echo Launching RythuDirect (Backend + Frontend)...
echo ========================================================

set SCRIPT_DIR=%~dp0

start "RythuDirect Backend" cmd /c "%SCRIPT_DIR%run_backend.bat"
timeout /t 2 /nobreak >nul
start "RythuDirect Frontend" cmd /c "%SCRIPT_DIR%run_frontend.bat"

echo.
echo Both servers are launching!
echo Backend:  http://localhost:8000 (API Docs: http://localhost:8000/api/v1/docs)
echo Frontend: http://localhost:5173
echo.
