@echo off
echo ========================================================
echo  Starting SepsisSense AI - React + Vite Frontend
echo ========================================================
echo Frontend URL: http://localhost:5173
echo.

cd /d "%~dp0\..\frontend"
call npm run dev
pause
