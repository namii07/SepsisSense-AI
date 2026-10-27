from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class ClinicalObservationInput(BaseModel):
    """
    Standard clinical observation inputs based on ICU sepsis benchmarks.
    Organized into Vital Signs, Laboratory Measurements, and Patient Demographics.
    """
    # Identifiers (Optional / Research anonymized)
    patient_pseudo_id: Optional[str] = Field(default="OBS-ICU-001", description="De-identified patient observation code")
    is_demo: Optional[bool] = Field(default=False, description="Flag indicating demonstration or test case")

    # Vital Signs
    HR: float = Field(..., ge=20.0, le=250.0, description="Heart Rate (beats per min). Normal ~60-100", example=98.0)
    Resp: float = Field(..., ge=4.0, le=70.0, description="Respiration Rate (breaths per min). Normal ~12-20", example=24.0)
    Temp: float = Field(..., ge=30.0, le=44.0, description="Body Temperature (°C). Normal ~36.5-37.5", example=38.4)
    MAP: float = Field(..., ge=20.0, le=200.0, description="Mean Arterial Pressure (mmHg). Normal ~70-105", example=65.0)
    O2Sat: float = Field(..., ge=50.0, le=100.0, description="Oxygen Saturation SpO2 (%). Normal ~95-100", example=93.0)
    SBP: Optional[float] = Field(default=105.0, ge=40.0, le=280.0, description="Systolic Blood Pressure (mmHg)", example=102.0)
    DBP: Optional[float] = Field(default=65.0, ge=20.0, le=160.0, description="Diastolic Blood Pressure (mmHg)", example=60.0)

    # Laboratory Measurements
    WBC: float = Field(..., ge=0.5, le=100.0, description="White Blood Cell count (x10^3/uL). Normal ~4.5-11.0", example=16.8)
    Lactate: Optional[float] = Field(default=2.1, ge=0.2, le=30.0, description="Serum Lactate (mmol/L). Normal <2.0", example=3.2)
    Creatinine: Optional[float] = Field(default=1.2, ge=0.1, le=20.0, description="Serum Creatinine (mg/dL). Normal ~0.6-1.3", example=1.8)
    Platelets: Optional[float] = Field(default=180.0, ge=5.0, le=1500.0, description="Platelet count (x10^3/uL). Normal ~150-400", example=135.0)
    Glucose: Optional[float] = Field(default=135.0, ge=20.0, le=1000.0, description="Blood Glucose (mg/dL). Normal ~70-140", example=160.0)
    BUN: Optional[float] = Field(default=22.0, ge=1.0, le=200.0, description="Blood Urea Nitrogen (mg/dL). Normal ~7-20", example=28.0)
    pH: Optional[float] = Field(default=7.36, ge=6.8, le=7.8, description="Arterial Blood pH. Normal ~7.35-7.45", example=7.32)

    # Demographics & Context
    Age: float = Field(..., ge=15.0, le=110.0, description="Patient Age (years)", example=68.0)
    ICULOS: float = Field(default=12.0, ge=1.0, le=1000.0, description="ICU Length of Stay (hours)", example=18.0)
    Gender: Optional[int] = Field(default=1, ge=0, le=1, description="Gender (0: Female, 1: Male)", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_pseudo_id": "DEMO-CASE-01",
                "is_demo": True,
                "HR": 108.0,
                "Resp": 26.0,
                "Temp": 38.6,
                "MAP": 62.0,
                "O2Sat": 92.0,
                "SBP": 96.0,
                "DBP": 52.0,
                "WBC": 17.4,
                "Lactate": 3.4,
                "Creatinine": 1.9,
                "Platelets": 125.0,
                "Glucose": 165.0,
                "BUN": 32.0,
                "pH": 7.31,
                "Age": 67.0,
                "ICULOS": 24.0,
                "Gender": 1
            }
        }


class FeatureContribution(BaseModel):
    feature: str
    feature_label: str
    value: float
    importance_weight: float
    direction: str  # "increases_risk" or "decreases_risk"
    explanation_text: str


class PredictionResponse(BaseModel):
    record_id: str
    timestamp: str
    patient_pseudo_id: str
    probability: float
    probability_percentage: float
    predicted_class: int  # 0 or 1
    predicted_label: str  # "Sepsis Prediction Positive" | "Sepsis Prediction Negative"
    risk_category: str  # "Low Risk", "Moderate Risk", "High Risk"
    classification_threshold: float
    model_version: str
    model_algorithm: str
    interpretation: str
    feature_contributions: List[FeatureContribution]
    disclaimer: str


class ExplainRequest(BaseModel):
    features: Dict[str, float]


class ExplainResponse(BaseModel):
    method: str
    base_probability: float
    predicted_probability: float
    contributions: List[FeatureContribution]
    notes: str
    disclaimer: str


class MetricSummary(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: Dict[str, int]  # tp, fp, tn, fn
    test_samples: int
    train_samples: int
    train_patients: int
    test_patients: int
    threshold: float


class ModelComparisonItem(BaseModel):
    model_name: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    is_primary: bool


class AnalyticsData(BaseModel):
    status: str
    model_name: str
    algorithm: str
    trained_at: str
    evaluation_type: str
    primary_metrics: MetricSummary
    models_comparison: List[ModelComparisonItem]
    roc_curve: List[Dict[str, float]]  # fpr, tpr
    pr_curve: List[Dict[str, float]]   # recall, precision
    feature_importances: List[Dict[str, Any]]  # feature, importance, description
    imbalance_notes: str


class DashboardStats(BaseModel):
    total_predictions: int
    positive_predictions: int
    negative_predictions: int
    positive_rate_percentage: float
    model_status: str
    dataset_status: str
    dataset_overview: Dict[str, Any]
    risk_distribution: Dict[str, int]
    recent_predictions: List[Dict[str, Any]]
    prediction_activity: List[Dict[str, Any]]


class HealthCheck(BaseModel):
    status: str
    timestamp: str
    backend_version: str
    model_status: str
    model_algorithm: str
    model_path: str
    dataset_status: str
    dataset_path: Optional[str]
    dataset_rows: Optional[int]
    database_status: str
    total_db_records: int
    explainability_status: str
    endpoints_available: List[str]
