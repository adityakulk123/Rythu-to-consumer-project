@echo off
title RythuDirect Frontend
echo ========================================================
echo Starting RythuDirect Frontend (Vite Dev Server)...
echo ========================================================

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%rythudirect\frontend"

call npm run dev
