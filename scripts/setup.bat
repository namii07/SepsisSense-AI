@echo off
echo ========================================================
echo  SepsisSense AI - Full Environment Setup (Windows)
echo ========================================================
echo.

cd /d "%~dp0\.."

echo [1/3] Installing Python Backend Dependencies...
pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Python dependency installation failed. Please check your python/pip configuration.
)

echo.
echo [2/3] Installing Frontend NPM Dependencies...
cd frontend
call npm install
cd ..
if %ERRORLEVEL% NEQ 0 (
    echo NPM install encountered errors. Please check Node.js installation.
)

echo.
echo [3/3] Training Initial Sepsis Classifier Pipeline...
python -m backend.train_model

echo.
echo ========================================================
echo  Setup Completed Successfully!
echo  To start the application, double-click: start_all.bat
echo ========================================================
pause
