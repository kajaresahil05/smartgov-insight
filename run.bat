@echo off
title SmartGov Insight Launcher
echo ===================================================
echo        Starting SmartGov Insight Platform
echo ===================================================

echo [1/2] Starting FastAPI Backend on port 5000...
start "SmartGov Backend" cmd /k "cd /d "%~dp0backend" && ".venv2\Scripts\python.exe" -m uvicorn main:app --port 5000 --reload"

echo [2/2] Starting Vite Frontend on port 3000...
start "SmartGov Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================
echo  Both services launched successfully!
echo   * Frontend UI: http://localhost:3000
echo   * Backend API: http://127.0.0.1:5000
echo ===================================================
pause
