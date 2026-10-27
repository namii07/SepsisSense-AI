# SepsisSense AI - Dataset Directory

Place your primary clinical dataset files in this directory or in the project root:
- `Dataset-selected-columns.csv` (Recommended: Curated subset of key clinical features)
- `Dataset.csv` (Full PhysioNet Challenge ICU dataset)

### Supported Columns
The pipeline automatically detects and processes:
- **Target**: `SepsisLabel` (0 for non-septic, 1 for sepsis onset)
- **Identifiers**: `Patient_ID` (used for patient-level train/test split to prevent data leakage) and `Unnamed: 0` (index column, safely excluded)
- **Clinical Features**:
  - `HR` (Heart Rate, bpm)
  - `Resp` (Respiration Rate, breaths/min)
  - `Temp` (Temperature, °C)
  - `MAP` (Mean Arterial Pressure, mmHg)
  - `O2Sat` (SpO2, %)
  - `SBP` (Systolic BP, mmHg)
  - `DBP` (Diastolic BP, mmHg)
  - `WBC` (White Blood Cell count, x10^3/µL)
  - `Lactate` (Serum Lactate, mmol/L)
  - `Creatinine` (Serum Creatinine, mg/dL)
  - `Platelets` (Platelet count, x10^3/µL)
  - `Glucose` (Blood Glucose, mg/dL)
  - `BUN` (Blood Urea Nitrogen, mg/dL)
  - `pH` (Arterial Blood pH)
  - `Age` (Patient Age, years)
  - `ICULOS` (ICU Length of Stay, hours)
  - `Gender` (Biological sex: 0 for Female, 1 for Male)

If no dataset is provided, the system automatically uses the embedded PhysioNet ICU benchmark dataset (`backend/artifacts/sample_dataset.csv`).
