# SepsisSense AI: A Machine Learning-Based System for Early Sepsis Prediction in ICU Patients

> **Academic & Research Prototype Disclaimer:**
> **SepsisSense AI is strictly an educational and academic research demonstration tool.** It is **NOT** a certified medical diagnostic device and must **NEVER** be used to direct patient care, clinical decisions, diagnostic conclusions, or therapeutic interventions. All predictions are probabilistic statistical classifications trained on retrospective benchmark data. Always consult qualified clinical healthcare professionals.

---

## 1. Project Overview

Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection (Sepsis-3 consensus). In Intensive Care Units (ICUs), rapid progression from systemic inflammatory response syndrome (SIRS) to septic shock makes early identification of physiological decompensation imperative.

**SepsisSense AI** is a full-stack clinical machine learning application designed to demonstrate:
- **Reproducible Data Preprocessing**: Multi-parameter physiological normalization, median imputation, and patient-level train/test isolation to prevent data leakage.
- **Cost-Sensitive Machine Learning**: Training penalized baseline Logistic Regression and Random Forest ensembles tailored for acute class imbalance (~5–10% positive sepsis incidence).
- **Explainable Artificial Intelligence (XAI)**: SHAP-based local attribution explaining which clinical vitals and laboratory biomarkers elevate or mitigate estimated sepsis risk.
- **Audit & Surveillance Persistence**: SQLite relational database logging of all inferences with complete input audit trails.
- **Medical Dashboard UX**: A dark obsidian clinical analytics interface built with React, Vite, Tailwind CSS, Lucide icons, and Recharts.

---

## 2. Technical Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6, Recharts, Lucide React, Axios |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Machine Learning** | Scikit-learn (RandomForestClassifier, LogisticRegression), NumPy, Pandas, Joblib |
| **Explainable AI** | SHAP (TreeExplainer & LinearExplainer), Standardized local contribution proxy |
| **Database & Storage** | SQLite, SQLAlchemy ORM |
| **Operating System** | Optimized for Windows (includes 1-click batch launcher scripts) |

---

## 3. Project File Structure

```text
SepsisSenseAI/
├── backend/
│   ├── artifacts/
│   │   ├── features.json           # Clinical feature definitions & reference ranges
│   │   ├── metrics.json            # Actual held-out test evaluation metrics & curves
│   │   └── sample_dataset.csv      # PhysioNet ICU benchmark dataset
│   ├── database.py                 # SQLite SQLAlchemy engine & session maker
│   ├── evaluate_model.py           # Sensitivity, PR-AUC, ROC-AUC, confusion matrix calculator
│   ├── explainability.py          # SHAP TreeExplainer & feature attribution engine
│   ├── main.py                     # FastAPI routes, CORS, lifespan event handlers
│   ├── models.py                   # SQLAlchemy ORM models (PredictionRecord)
│   ├── predictor.py                # Inference service, thresholding, and DB logging
│   ├── preprocessing.py            # Patient-level group splitting, scaling, imputation
│   ├── requirements.txt            # Python dependencies
│   ├── schemas.py                  # Pydantic validation schemas
│   ├── seed_data.py                # Initial clinical demonstration cases
│   └── train_model.py              # Reproducible patient-level ML training script
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Medical cross branding icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfusionMatrix.jsx          # 2x2 grid with sensitivity & specificity
│   │   │   ├── FeatureContributionChart.jsx # SHAP impact bars with clinical rationale
│   │   │   ├── MedicalDisclaimer.jsx        # Prominent research disclaimer banner
│   │   │   ├── MetricCard.jsx               # KPI summary card with glowing accents
│   │   │   ├── RiskMeter.jsx                # Tri-color segmented risk probability gauge
│   │   │   ├── Sidebar.jsx                  # Collapsible navigation sidebar
│   │   │   └── Topbar.jsx                   # Route breadcrumbs & system health pills
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.jsx            # Held-out ROC/PR curves & model comparison
│   │   │   ├── DashboardPage.jsx            # Summary KPIs, class imbalance & activity charts
│   │   │   ├── HistoryPage.jsx              # Paginated SQLite history table & inspection modal
│   │   │   ├── PredictPage.jsx              # Clinical observation form & risk assessment
│   │   │   └── SystemStatusPage.jsx         # Live subsystem health diagnostics
│   │   ├── services/
│   │   │   └── api.js                       # Axios HTTP client with environment baseURL
│   │   ├── App.jsx                          # React Router configuration
│   │   ├── index.css                        # Tailwind directives & medical glass styles
│   │   └── main.jsx                         # React DOM mount
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── data/
│   └── README.md                   # Instructions for placing Dataset.csv
├── scripts/
│   ├── run_backend.bat             # Starts FastAPI server on port 8000
│   ├── run_frontend.bat            # Starts React Vite dev server on port 5173
│   ├── setup.bat                   # Installs pip and npm dependencies
│   └── train_model.bat             # Executes training pipeline script
├── start_all.bat                   # 1-Click launcher starting both servers
├── README.md
└── .gitignore
```

---

## 4. Supported Clinical Features

The model processes standard PhysioNet ICU telemetry variables:
1. **Vital Signs**:
   - `HR`: Heart Rate (60–100 bpm) — Tachycardia (>90 bpm) is a core SIRS trigger
   - `Resp`: Respiration Rate (12–20 br/min) — Tachypnea (>20) marks metabolic acidosis compensation
   - `Temp`: Body Temperature (36.5–37.5 °C) — Fever (>38.0°C) or hypothermia (<36.0°C)
   - `MAP`: Mean Arterial Pressure (70–105 mmHg) — MAP < 65 mmHg signals septic shock hypoperfusion
   - `O2Sat`: Pulse Oximetry SpO2 (95–100 %) — Decreases with acute respiratory compromise
   - `SBP` & `DBP`: Systolic & Diastolic Blood Pressures (mmHg)
2. **Laboratory Measurements**:
   - `WBC`: White Blood Cell Count (4.5–11.0 x10³/µL) — Leukocytosis or leukopenia
   - `Lactate`: Serum Lactate (0.5–2.0 mmol/L) — >2.0 mmol/L marks tissue anaerobic glycolysis
   - `Creatinine`: Serum Creatinine (0.6–1.2 mg/dL) — Acute renal injury marker
   - `Platelets`: Platelet Count (150–400 x10³/µL) — Consumptive coagulopathy (<150)
   - `Glucose`: Blood Glucose (70–140 mg/dL) — Stress hyperglycemia
   - `BUN`: Blood Urea Nitrogen (7–20 mg/dL)
   - `pH`: Arterial Blood pH (7.35–7.45) — Acidemia in septic shock
3. **Demographics**:
   - `Age`: Patient Age (years)
   - `ICULOS`: ICU Length of Stay (hours)
   - `Gender`: Biological Sex (0: Female, 1: Male)

---

## 5. Quick Start Instructions (Windows)

### Option A: 1-Click Launch (Recommended)
1. Double-click `scripts\setup.bat` to install Python and npm packages and run initial model training.
2. Double-click `start_all.bat` in the project root to start both backend and frontend servers.
3. The application will automatically open in your default browser at `http://localhost:5173`.

---

### Option B: Step-by-Step Manual Launch

#### Step 1: Install Python Dependencies
Open PowerShell or Command Prompt in the repository root:
```powershell
pip install -r backend\requirements.txt
```

#### Step 2: (Optional) Train the Machine Learning Pipeline
If you wish to retrain on your own dataset (`Dataset.csv` or `Dataset-selected-columns.csv`):
```powershell
python -m backend.train_model
```
*Note: If no dataset is provided in root, the pipeline will automatically utilize the embedded PhysioNet ICU benchmark dataset.*

#### Step 3: Launch FastAPI Backend Server
```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

#### Step 4: Install Frontend Dependencies & Launch Vite
In a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 6. Guide for the Six Required Report Screenshots

The application is specifically designed to provide clear, high-resolution screens for all six project deliverables:

### Screenshot 1 — Main Dashboard (`http://localhost:5173/`)
- **Key Elements**: Collapsible sidebar, summary KPI cards (Total Predictions, Positive Predictions, Lower-Risk Predictions, Active Model Status), dataset summary panel, class distribution doughnut chart, prediction activity timeline, risk tier distribution bar chart, and recent prediction records table.

### Screenshot 2 — Sepsis Prediction Form (`http://localhost:5173/predict`)
- **Key Elements**: Categorized clinical inputs (Vital Signs, Laboratory Measurements, Demographics), parameter reference range guides, preset buttons ("Load Sepsis Case Demo", "Load Normal Case Demo"), and the clearly visible "Estimate Sepsis Risk" action button.

### Screenshot 3 — Prediction Results with Explainability (`http://localhost:5173/predict`)
- **Key Elements**: Estimated probability percentage (e.g. 82.4%), predicted classification badge, color-coded risk meter gauge with experimental threshold indicator, SHAP-derived local feature contribution bars (showing positive/negative risk impacts with clinical explanations), and the medical disclaimer.

### Screenshot 4 — Model Analytics (`http://localhost:5173/analytics`)
- **Key Elements**: Training cohort vs test cohort sizes, patient-level group split note, 6 evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC), 2x2 Confusion Matrix with sensitivity & specificity, ROC curve chart, Precision-Recall curve chart, baseline vs primary model comparison table, and global feature importance chart.

### Screenshot 5 — Prediction History (`http://localhost:5173/history`)
- **Key Elements**: Immutable SQLite prediction audit log, search input, risk category dropdown filter, sorting selector, paginated records table, and the "Details" inspection modal displaying recorded input telemetry and logged feature contributions.

### Screenshot 6 — System Status (`http://localhost:5173/system`)
- **Key Elements**: Live subsystem health indicators (FastAPI backend, Random Forest model artifact, PhysioNet dataset, SQLite database, SHAP explainability engine), "Run Diagnostics" button, registered API endpoint registry, and environment file paths.

---

## 7. Backend API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Live operational health check of all 5 subsystem components |
| `GET` | `/api/dashboard` | Aggregated KPI counts, dataset overview, and prediction timeline |
| `POST` | `/predict` | Validates clinical inputs, executes model inference, and logs to SQLite |
| `POST` | `/explain` | Returns local feature attributions for arbitrary feature inputs |
| `GET` | `/api/analytics` | Held-out test evaluation metrics, ROC curve, PR curve, and confusion matrix |
| `GET` | `/api/history` | Paginated prediction records with search, filtering, and sorting |
| `GET` | `/api/stats` | High-level inference volume counts |
| `GET` | `/api/features` | Metadata dictionary of all supported physiological variables |

---

## 8. Machine Learning Methodology

1. **Patient-Level Group Splitting**: Because ICU patients undergo serial physiological measurements over hours or days, naive observation-level random splitting causes data leakage between identical patients. SepsisSense AI utilizes `GroupShuffleSplit` on `Patient_ID` so the held-out test cohort consists entirely of unseen patients.
2. **Handling Class Imbalance**: In acute ICU sepsis, non-septic observations overwhelmingly outnumber septic events (~9:1 ratio). Standard Accuracy is misleading. The model utilizes balanced class weighting (`class_weight='balanced'`) and is tuned using **Recall (Sensitivity)** and **Precision-Recall AUC (PR-AUC)**.
3. **Experimental Threshold Selection**: Rather than relying on a default 0.50 threshold, an experimental classification threshold of **0.40** is selected to maximize early warning sensitivity while mitigating alarm fatigue.

---

## 9. Troubleshooting

- **Port 8000 or 5173 already in use**:
  - Run `netstat -ano | findstr :8000` to find conflicting process IDs.
  - Or launch backend on an alternate port: `python -m uvicorn backend.main:app --port 8001` and update `frontend/.env` accordingly (`VITE_API_BASE_URL=http://localhost:8001`).
- **SHAP installation notice**:
  - If compiling `shap` C-extensions fails on your Windows environment, SepsisSense AI includes an automatic standardized linear/tree proxy attribution fallback that functions seamlessly without requiring C++ build tools.
