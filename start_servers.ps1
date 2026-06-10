Write-Host "Starting Brain Tumor Detection App (Combined Server Mode)..." -ForegroundColor Green
Write-Host ""

Write-Host "[1/2] Building React Frontend static assets..." -ForegroundColor Yellow
Set-Location "frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ [ERROR] Frontend compilation failed! Please verify dependencies are installed by running 'npm install' in the frontend directory." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    Exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/2] Launching Backend Server on http://localhost:5000..." -ForegroundColor Yellow
Set-Location "../backend"
.\venv\Scripts\python.exe app.py
