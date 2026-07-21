@echo off
echo Starting Brain Tumor Detection App...
echo.

set REBUILD=0
if "%1"=="--rebuild" set REBUILD=1
if "%1"=="-r" set REBUILD=1
if not exist "frontend\build\index.html" set REBUILD=1

if "%REBUILD%"=="1" (
    echo [1/2] Building React Frontend static assets...
    cd frontend
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo ❌ [ERROR] Frontend compilation failed! Please verify dependencies are installed by running "npm install" in the frontend directory.
        pause
        exit /b %errorlevel%
    )
    cd ..
) else (
    echo [1/2] Using existing frontend build (pass --rebuild to force rebuild)...
)

echo.
echo [2/2] Launching Backend Server on http://localhost:5000...
cd backend
venv\Scripts\python.exe app.py