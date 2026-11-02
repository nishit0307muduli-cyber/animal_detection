# -------------------------------------------------
# File: D:\Animal\bootstrap_and_start.ps1
# -------------------------------------------------
# 1️⃣ Ensure a virtual environment exists (create if missing)
if (-Not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment…"
    # Try to locate a Python interpreter; fallback to 'python' from PATH
    $pythonExe = "C:\Users\nishi\AppData\Local\Programs\Python\Python313\python.exe"
    if (-Not (Test-Path $pythonExe)) { $pythonExe = "python" }
    & $pythonExe -m venv .venv
}

# 2️⃣ Activate the venv for this session
$env:VIRTUAL_ENV = (Resolve-Path ".venv").Path
$env:PATH = "$env:VIRTUAL_ENV\Scripts;$env:PATH"
Write-Host "Activated venv at $env:VIRTUAL_ENV"

# 3️⃣ Upgrade pip and install backend requirements
Write-Host "Installing backend dependencies…"
pip install --quiet --upgrade pip
pip install --quiet -r backend\requirements.txt

# 4️⃣ Verify key packages are importable (debug aid)
Write-Host "Testing imports…"
python -c "import fastapi, uvicorn, ultralytics, PIL; print('IMPORT OK')"

# 5️⃣ Launch backend (FastAPI) – non‑blocking
Write-Host "Launching backend…"
Start-Process -FilePath "$env:VIRTUAL_ENV\Scripts\python.exe" \
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" \
    -WorkingDirectory "D:\Animal\backend" \
    -WindowStyle Normal \
    -PassThru | Out-Null

# 6️⃣ Launch frontend (Vite) – non‑blocking
Write-Host "Launching frontend…"
Start-Process -FilePath "cmd.exe" \
    -ArgumentList "/c cd /d D:\Animal\frontend ^&^& npm run dev" \
    -WindowStyle Normal \
    -PassThru | Out-Null

Write-Host "✅ Services started – open http://localhost:5173 and http://localhost:8000/docs"
