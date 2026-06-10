@echo off
echo Starting Brain Tumor Detection App (Combined Server Mode)...
echo.

echo [1/2] Building React Frontend static assets...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ [ERROR] Frontend compilation failed! Please verify dependencies are installed by running "npm install" in the frontend directory.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Launching Backend Server on http://localhost:5000...
cd ../backend
venv\Scripts\python.exe app.py