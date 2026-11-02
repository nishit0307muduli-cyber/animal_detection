@echo off
title RailGuard AI — Setup
echo ================================================
echo   RailGuard AI - Animal Detection System
echo   Setting up Python environment...
echo ================================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

:: Create virtual environment
if not exist "venv" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
)

:: Activate venv
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

:: Install requirements
echo [3/3] Installing dependencies (this may take a few minutes)...
pip install -r requirements.txt

echo.
echo ================================================
echo   Setup complete!
echo   Run 'start.bat' to launch the application.
echo ================================================
pause
