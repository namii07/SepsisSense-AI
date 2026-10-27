@echo off
echo ========================================================
echo  Launching SepsisSense AI Full-Stack Application
echo ========================================================
echo.
echo Starting FastAPI Backend (Port 8000)...
start "SepsisSense AI - Backend" cmd /k "scripts\run_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting React + Vite Frontend (Port 5173)...
start "SepsisSense AI - Frontend" cmd /k "scripts\run_frontend.bat"

echo.
echo ========================================================
echo  Application is launching:
echo   - Frontend: http://localhost:5173
echo   - Backend API: http://localhost:8000
echo   - API Swagger Docs: http://localhost:8000/docs
echo ========================================================
timeout /t 5 >nul
start http://localhost:5173
