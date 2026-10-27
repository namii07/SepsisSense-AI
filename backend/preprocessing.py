import os
import json
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Any, Optional
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

# Canonical Clinical Features Metadata
CLINICAL_FEATURES_META = {
    "HR": {
        "label": "Heart Rate",
        "unit": "bpm",
        "category": "vital_signs",
        "normal_range": [60.0, 100.0],
        "default": 82.0,
        "description": "Tachycardia (>90 bpm) is a core SIRS criterion reflecting autonomic stress in infection.",
        "sofa_relevant": True
    },
    "Resp": {
        "label": "Respiration Rate",
        "unit": "breaths/min",
        "category": "vital_signs",
        "normal_range": [12.0, 20.0],
        "default": 18.0,
        "description": "Tachypnea (>20 breaths/min) indicates respiratory compensation for metabolic acidosis or pulmonary injury.",
        "sofa_relevant": True
    },
    "Temp": {
        "label": "Body Temperature",
        "unit": "°C",
        "category": "vital_signs",
        "normal_range": [36.5, 37.5],
        "default": 37.0,
        "description": "Hyperthermia (>38.0°C) or hypothermia (<36.0°C) indicates dysregulated host immune response.",
        "sofa_relevant": False
    },
    "MAP": {
        "label": "Mean Arterial Pressure",
        "unit": "mmHg",
        "category": "vital_signs",
        "normal_range": [70.0, 105.0],
        "default": 85.0,
        "description": "MAP < 65 mmHg is a critical septic shock criterion indicating hypoperfusion.",
        "sofa_relevant": True
    },
    "O2Sat": {
        "label": "Oxygen Saturation (SpO2)",
        "unit": "%",
        "category": "vital_signs",
        "normal_range": [95.0, 100.0],
        "default": 97.0,
        "description": "Peripheral arterial oxygen saturation, decreases with respiratory failure and hypoxia.",
        "sofa_relevant": True
    },
    "SBP": {
        "label": "Systolic Blood Pressure",
        "unit": "mmHg",
        "category": "vital_signs",
        "normal_range": [90.0, 120.0],
        "default": 115.0,
        "description": "Systolic pressure; hypotension (SBP < 90 mmHg) is a key qSOFA trigger.",
        "sofa_relevant": True
    },
    "DBP": {
        "label": "Diastolic Blood Pressure",
        "unit": "mmHg",
        "category": "vital_signs",
        "normal_range": [60.0, 80.0],
        "default": 72.0,
        "description": "Diastolic vascular resistance component.",
        "sofa_relevant": False
    },
    "WBC": {
        "label": "White Blood Cell Count",
        "unit": "x10^3/µL",
        "category": "laboratory",
        "normal_range": [4.5, 11.0],
        "default": 7.5,
        "description": "Leukocytosis (>12) or leukopenia (<4) reflects active systemic inflammatory mobilization.",
        "sofa_relevant": False
    },
    "Lactate": {
        "label": "Serum Lactate",
        "unit": "mmol/L",
        "category": "laboratory",
        "normal_range": [0.5, 2.0],
        "default": 1.4,
        "description": "Elevated lactate (>2.0 mmol/L) marks tissue hypoperfusion and anaerobic glycolysis in sepsis.",
        "sofa_relevant": True
    },
    "Creatinine": {
        "label": "Serum Creatinine",
        "unit": "mg/dL",
        "category": "laboratory",
        "normal_range": [0.6, 1.2],
        "default": 0.95,
        "description": "Acute elevation signifies renal dysfunction and contributes to SOFA score assessment.",
        "sofa_relevant": True
    },
    "Platelets": {
        "label": "Platelet Count",
        "unit": "x10^3/µL",
        "category": "laboratory",
        "normal_range": [150.0, 400.0],
        "default": 240.0,
        "description": "Thrombocytopenia (<150) indicates consumption coagulopathy or septic microangiopathy.",
        "sofa_relevant": True
    },
    "Glucose": {
        "label": "Blood Glucose",
        "unit": "mg/dL",
        "category": "laboratory",
        "normal_range": [70.0, 140.0],
        "default": 110.0,
        "description": "Stress-induced hyperglycemia or hypoglycemia in severe septic states.",
        "sofa_relevant": False
    },
    "BUN": {
        "label": "Blood Urea Nitrogen",
        "unit": "mg/dL",
        "category": "laboratory",
        "normal_range": [7.0, 20.0],
        "default": 14.0,
        "description": "Nitrogenous waste accumulation marking prerenal azotemia and dehydration.",
        "sofa_relevant": False
    },
    "pH": {
        "label": "Arterial Blood pH",
        "unit": "units",
        "category": "laboratory",
        "normal_range": [7.35, 7.45],
        "default": 7.40,
        "description": "Acid-base equilibrium; acidemia (pH < 7.35) marks metabolic acidosis in septic shock.",
        "sofa_relevant": True
    },
    "Age": {
        "label": "Patient Age",
        "unit": "years",
        "category": "demographics",
        "normal_range": [18.0, 85.0],
        "default": 62.0,
        "description": "Advanced age (>65) substantially increases susceptibility and mortality risk for sepsis.",
        "sofa_relevant": False
    },
    "ICULOS": {
        "label": "ICU Length of Stay",
        "unit": "hours",
        "category": "demographics",
        "normal_range": [1.0, 168.0],
        "default": 14.0,
        "description": "Cumulative hours in ICU; prolonged stays elevate risk of hospital-acquired septic events.",
        "sofa_relevant": False
    },
    "Gender": {
        "label": "Biological Sex",
        "unit": "0=F, 1=M",
        "category": "demographics",
        "normal_range": [0, 1],
        "default": 1,
        "description": "Biological sex indicator for demographic adjustment.",
        "sofa_relevant": False
    }
}

CORE_FEATURE_NAMES = list(CLINICAL_FEATURES_META.keys())


def load_raw_dataset(candidate_paths: Optional[List[str]] = None) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    Looks for the sepsis dataset in known project locations:
    1. Dataset-selected-columns.csv
    2. Dataset.csv
    3. data/Dataset-selected-columns.csv
    4. data/Dataset.csv
    5. backend/artifacts/sample_dataset.csv
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if not candidate_paths:
        candidate_paths = [
            os.path.join(base_dir, "Dataset-selected-columns.csv"),
            os.path.join(base_dir, "Dataset.csv"),
            os.path.join(base_dir, "data", "Dataset-selected-columns.csv"),
            os.path.join(base_dir, "data", "Dataset.csv"),
            os.path.join(base_dir, "backend", "artifacts", "sample_dataset.csv"),
        ]

    for path in candidate_paths:
        if os.path.exists(path) and os.path.getsize(path) > 100:
            try:
                df = pd.read_csv(path)
                if "SepsisLabel" in df.columns:
                    return df, path
            except Exception as e:
                print(f"Error loading {path}: {e}")
                continue

    return None, None


def clean_and_prepare_features(
    df: pd.DataFrame,
    feature_names: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, pd.Series, Optional[pd.Series], List[str]]:
    """
    Prepares features matrix X and target y from the dataset.
    - Excludes index columns (Unnamed: 0) and patient IDs from X
    - Retains Patient_ID separately for patient-level grouping
    - Converts columns to numeric, replacing infinities with NaN
    """
    df = df.copy()

    # Drop obvious index column if present
    for col in ["Unnamed: 0", "index", "id"]:
        if col in df.columns and col.lower() != "patient_id":
            df = df.drop(columns=[col])

    # Target column validation
    if "SepsisLabel" not in df.columns:
        raise ValueError("Dataset must contain target column 'SepsisLabel'")

    # Remove rows where target is NaN or invalid
    df = df.dropna(subset=["SepsisLabel"])
    df["SepsisLabel"] = pd.to_numeric(df["SepsisLabel"], errors="coerce").astype(int)
    df = df[df["SepsisLabel"].isin([0, 1])]

    # Extract patient identifiers if present
    patient_ids = None
    for pid_col in ["Patient_ID", "patient_id", "PatientID", "pid"]:
        if pid_col in df.columns:
            patient_ids = df[pid_col].astype(str)
            df = df.drop(columns=[pid_col])
            break

    y = df["SepsisLabel"]
    X_raw = df.drop(columns=["SepsisLabel"])

    # Determine features to use
    if feature_names is not None:
        usable_features = [f for f in feature_names if f in X_raw.columns]
    else:
        # Use intersection of available columns and known clinical features, or all numeric columns
        common_features = [f for f in CORE_FEATURE_NAMES if f in X_raw.columns]
        if len(common_features) >= 5:
            usable_features = common_features
        else:
            # Fall back to all numeric columns
            usable_features = [c for c in X_raw.columns if pd.api.types.is_numeric_dtype(X_raw[c])]

    X = X_raw[usable_features].copy()

    # Convert all to float, replace inf with nan
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors="coerce")
        X[col] = X[col].replace([np.inf, -np.inf], np.nan)

    return X, y, patient_ids, usable_features


def split_train_test(
    X: pd.DataFrame,
    y: pd.Series,
    patient_ids: Optional[pd.Series] = None,
    test_size: float = 0.20,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, int, int]:
    """
    Performs patient-level train/test splitting to prevent observational leakage.
    If patient IDs are not available, falls back to stratified splitting.
    """
    if patient_ids is not None and len(patient_ids.unique()) > 10:
        # Patient-level splitting
        gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
        train_idx, test_idx = next(gss.split(X, y, groups=patient_ids))
        
        X_train = X.iloc[train_idx].copy()
        X_test = X.iloc[test_idx].copy()
        y_train = y.iloc[train_idx].copy()
        y_test = y.iloc[test_idx].copy()

        train_patients = len(patient_ids.iloc[train_idx].unique())
        test_patients = len(patient_ids.iloc[test_idx].unique())
    else:
        # Stratified observation split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        train_patients = len(X_train)
        test_patients = len(X_test)

    return X_train, X_test, y_train, y_test, train_patients, test_patients


class ClinicalPreprocessor:
    """
    Encapsulates feature imputation and standard scaling.
    Ensures transformers are strictly fitted ONLY on the training split.
    """
    def __init__(self, feature_names: List[str]):
        self.feature_names = feature_names
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.imputed_medians_: Dict[str, float] = {}
        self.is_fitted = False

    def fit(self, X_train: pd.DataFrame):
        X_subset = X_train[self.feature_names]
        self.imputer.fit(X_subset)
        X_imputed = self.imputer.transform(X_subset)
        self.scaler.fit(X_imputed)

        for col, med in zip(self.feature_names, self.imputer.statistics_):
            self.imputed_medians_[col] = float(med)

        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Preprocessor has not been fitted.")
        X_subset = X[self.feature_names]
        X_imputed = self.imputer.transform(X_subset)
        X_scaled = self.scaler.transform(X_imputed)
        return X_scaled

    def fit_transform(self, X_train: pd.DataFrame) -> np.ndarray:
        self.fit(X_train)
        return self.transform(X_train)

    def transform_single_dict(self, input_dict: Dict[str, float]) -> np.ndarray:
        """Transforms a single observation dictionary into a scaled 2D array."""
        row = []
        for feature in self.feature_names:
            val = input_dict.get(feature)
            if val is None or np.isnan(val):
                val = self.imputed_medians_.get(feature, CLINICAL_FEATURES_META.get(feature, {}).get("default", 0.0))
            row.append(float(val))
        
        arr = np.array([row])
        arr_imputed = self.imputer.transform(arr)
        arr_scaled = self.scaler.transform(arr_imputed)
        return arr_scaled
