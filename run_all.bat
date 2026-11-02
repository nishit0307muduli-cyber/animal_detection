@echo off
rem ------------------------------------------------------------
rem   Railway Animal Detection – start both backend & frontend
rem ------------------------------------------------------------

rem ---- Backend -------------------------------------------------
start "Backend (FastAPI)" cmd /k "cd /d D:\Animal\backend && D:\Animal\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

rem ---- Frontend ------------------------------------------------
start "Frontend (Vite)" cmd /k "cd /d D:\Animal\frontend && npm run dev"

echo Both services launched. Open http://localhost:5173 and http://localhost:8000/docs
