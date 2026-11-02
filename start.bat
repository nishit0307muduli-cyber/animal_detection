@echo off
title RailGuard AI — Server
echo ================================================
echo   RailGuard AI - Animal Detection System
echo   Starting server on http://localhost:8000
echo ================================================
echo.

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [*] Loading YOLOv8 model (first run downloads ~6MB)...
echo [*] Open http://localhost:8000 in your browser
echo.
echo Press Ctrl+C to stop the server.
echo ================================================

python main.py
pause
