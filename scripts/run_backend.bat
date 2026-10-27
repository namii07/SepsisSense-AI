@echo off
echo ========================================================
echo  Starting SepsisSense AI - FastAPI Backend Server
echo ========================================================
echo API URL: http://localhost:8000
echo Swagger Docs: http://localhost:8000/docs
echo.

cd /d "%~dp0\.."
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
