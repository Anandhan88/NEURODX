@echo off
echo ========================================================
echo Starting NeuroDX AI Brain Tumor Detection Platform
echo ========================================================

start "Flask Backend API" cmd /k "cd backend && .\venv\Scripts\python.exe app.py"
start "React Frontend App" cmd /k "cd frontend && npm start"

echo.
echo Backend running on http://127.0.0.1:5000
echo Frontend running on http://localhost:3000
echo.
