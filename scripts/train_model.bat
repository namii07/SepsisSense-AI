@echo off
echo ========================================================
echo  SepsisSense AI - Machine Learning Pipeline Training
echo ========================================================
echo Loading dataset, evaluating models, and persisting artifacts...
echo.

cd /d "%~dp0\.."
python -m backend.train_model
echo.
echo Model training process complete.
pause
