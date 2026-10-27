import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import PredictionRecord

INITIAL_SEED_CASES = [
    {
        "record_id": "PRED-20261017-0941-A1",
        "offset_hours": 36,
        "patient_pseudo_id": "ICU-BED-04",
        "probability": 0.824,
        "predicted_class": 1,
        "predicted_label": "Sepsis Prediction Positive",
        "risk_category": "High Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Post-op septic shock trajectory with lactic acidosis",
        "input_features": {
            "HR": 118.0, "Resp": 28.0, "Temp": 38.9, "MAP": 58.0, "O2Sat": 91.0,
            "SBP": 88.0, "DBP": 48.0, "WBC": 19.4, "Lactate": 4.2, "Creatinine": 2.4,
            "Platelets": 110.0, "Glucose": 178.0, "BUN": 38.0, "pH": 7.28,
            "Age": 71.0, "ICULOS": 36.0, "Gender": 1
        },
        "top_factors": [
            {"feature": "Lactate", "feature_label": "Serum Lactate", "value": 4.2, "importance_weight": 0.285, "direction": "increases_risk", "explanation_text": "Elevated Serum Lactate (4.2 mmol/L) marks tissue hypoperfusion."},
            {"feature": "MAP", "feature_label": "Mean Arterial Pressure", "value": 58.0, "importance_weight": 0.224, "direction": "increases_risk", "explanation_text": "MAP < 65 mmHg indicates severe hemodynamic hypotension."},
            {"feature": "WBC", "feature_label": "White Blood Cell Count", "value": 19.4, "importance_weight": 0.192, "direction": "increases_risk", "explanation_text": "Severe leukocytosis reflects systemic inflammatory mobilization."}
        ]
    },
    {
        "record_id": "PRED-20261017-1422-B2",
        "offset_hours": 28,
        "patient_pseudo_id": "ICU-BED-12",
        "probability": 0.142,
        "predicted_class": 0,
        "predicted_label": "Sepsis Prediction Negative",
        "risk_category": "Low Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Stable post-CABG observation, normal inflammatory markers",
        "input_features": {
            "HR": 74.0, "Resp": 16.0, "Temp": 37.0, "MAP": 84.0, "O2Sat": 98.0,
            "SBP": 120.0, "DBP": 72.0, "WBC": 7.2, "Lactate": 1.1, "Creatinine": 0.9,
            "Platelets": 265.0, "Glucose": 105.0, "BUN": 14.0, "pH": 7.41,
            "Age": 58.0, "ICULOS": 18.0, "Gender": 0
        },
        "top_factors": [
            {"feature": "Lactate", "feature_label": "Serum Lactate", "value": 1.1, "importance_weight": -0.210, "direction": "decreases_risk", "explanation_text": "Normal serum lactate indicates stable organ perfusion."},
            {"feature": "WBC", "feature_label": "White Blood Cell Count", "value": 7.2, "importance_weight": -0.185, "direction": "decreases_risk", "explanation_text": "Normal leukocyte count indicates absence of acute leukocytosis."},
            {"feature": "MAP", "feature_label": "Mean Arterial Pressure", "value": 84.0, "importance_weight": -0.142, "direction": "decreases_risk", "explanation_text": "Hemodynamically stable arterial pressure."}
        ]
    },
    {
        "record_id": "PRED-20261017-1905-C3",
        "offset_hours": 22,
        "patient_pseudo_id": "ICU-BED-07",
        "probability": 0.448,
        "predicted_class": 1,
        "predicted_label": "Sepsis Prediction Positive",
        "risk_category": "Moderate Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Borderline febrile patient with rising respiration rate",
        "input_features": {
            "HR": 94.0, "Resp": 23.0, "Temp": 38.3, "MAP": 72.0, "O2Sat": 94.0,
            "SBP": 106.0, "DBP": 62.0, "WBC": 13.5, "Lactate": 2.2, "Creatinine": 1.3,
            "Platelets": 190.0, "Glucose": 142.0, "BUN": 22.0, "pH": 7.36,
            "Age": 65.0, "ICULOS": 12.0, "Gender": 1
        },
        "top_factors": [
            {"feature": "Resp", "feature_label": "Respiration Rate", "value": 23.0, "importance_weight": 0.165, "direction": "increases_risk", "explanation_text": "Tachypnea indicates mild respiratory compensatory effort."},
            {"feature": "Temp", "feature_label": "Body Temperature", "value": 38.3, "importance_weight": 0.148, "direction": "increases_risk", "explanation_text": "Pyrexia supports systemic inflammatory response."},
            {"feature": "Platelets", "feature_label": "Platelet Count", "value": 190.0, "importance_weight": -0.082, "direction": "decreases_risk", "explanation_text": "Platelet count remains within normal parameters."}
        ]
    },
    {
        "record_id": "PRED-20261018-0230-D4",
        "offset_hours": 14,
        "patient_pseudo_id": "ICU-BED-02",
        "probability": 0.765,
        "predicted_class": 1,
        "predicted_label": "Sepsis Prediction Positive",
        "risk_category": "High Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Severe sepsis with secondary renal impairment and thrombocytopenia",
        "input_features": {
            "HR": 112.0, "Resp": 27.0, "Temp": 38.7, "MAP": 61.0, "O2Sat": 92.0,
            "SBP": 92.0, "DBP": 50.0, "WBC": 16.8, "Lactate": 3.7, "Creatinine": 2.2,
            "Platelets": 128.0, "Glucose": 168.0, "BUN": 34.0, "pH": 7.30,
            "Age": 74.0, "ICULOS": 48.0, "Gender": 0
        },
        "top_factors": [
            {"feature": "Lactate", "feature_label": "Serum Lactate", "value": 3.7, "importance_weight": 0.264, "direction": "increases_risk", "explanation_text": "Hyperlactatemia marks progressive cellular hypoxia."},
            {"feature": "Creatinine", "feature_label": "Serum Creatinine", "value": 2.2, "importance_weight": 0.201, "direction": "increases_risk", "explanation_text": "Acute creatinine elevation reflects renal hypoperfusion."},
            {"feature": "HR", "feature_label": "Heart Rate", "value": 112.0, "importance_weight": 0.178, "direction": "increases_risk", "explanation_text": "Marked tachycardia reflects severe circulatory demand."}
        ]
    },
    {
        "record_id": "PRED-20261018-0815-E5",
        "offset_hours": 8,
        "patient_pseudo_id": "ICU-BED-19",
        "probability": 0.088,
        "predicted_class": 0,
        "predicted_label": "Sepsis Prediction Negative",
        "risk_category": "Low Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Routine morning ICU round; stable baseline vitals",
        "input_features": {
            "HR": 68.0, "Resp": 14.0, "Temp": 36.8, "MAP": 90.0, "O2Sat": 99.0,
            "SBP": 126.0, "DBP": 76.0, "WBC": 6.8, "Lactate": 0.9, "Creatinine": 0.8,
            "Platelets": 290.0, "Glucose": 98.0, "BUN": 12.0, "pH": 7.42,
            "Age": 49.0, "ICULOS": 8.0, "Gender": 1
        },
        "top_factors": [
            {"feature": "HR", "feature_label": "Heart Rate", "value": 68.0, "importance_weight": -0.230, "direction": "decreases_risk", "explanation_text": "Resting heart rate in ideal physiological range."},
            {"feature": "Lactate", "feature_label": "Serum Lactate", "value": 0.9, "importance_weight": -0.215, "direction": "decreases_risk", "explanation_text": "Low lactate indicates adequate microvascular delivery."},
            {"feature": "O2Sat", "feature_label": "Oxygen Saturation (SpO2)", "value": 99.0, "importance_weight": -0.160, "direction": "decreases_risk", "explanation_text": "Excellent arterial oxygenation."}
        ]
    },
    {
        "record_id": "PRED-20261018-1250-F6",
        "offset_hours": 4,
        "patient_pseudo_id": "ICU-BED-09",
        "probability": 0.365,
        "predicted_class": 0,
        "predicted_label": "Sepsis Prediction Negative",
        "risk_category": "Moderate Risk",
        "threshold_used": 0.40,
        "model_version": "RandomForest-v1.0 (SHAP TreeExplainer)",
        "notes": "Mild leukocytosis under antibiotic treatment",
        "input_features": {
            "HR": 88.0, "Resp": 20.0, "Temp": 37.8, "MAP": 76.0, "O2Sat": 96.0,
            "SBP": 112.0, "DBP": 68.0, "WBC": 12.8, "Lactate": 1.7, "Creatinine": 1.1,
            "Platelets": 210.0, "Glucose": 125.0, "BUN": 18.0, "pH": 7.38,
            "Age": 62.0, "ICULOS": 20.0, "Gender": 0
        },
        "top_factors": [
            {"feature": "WBC", "feature_label": "White Blood Cell Count", "value": 12.8, "importance_weight": 0.125, "direction": "increases_risk", "explanation_text": "Mild leukocytosis maintains slight upward risk pressure."},
            {"feature": "Lactate", "feature_label": "Serum Lactate", "value": 1.7, "importance_weight": -0.095, "direction": "decreases_risk", "explanation_text": "Lactate remains < 2.0 mmol/L."},
            {"feature": "MAP", "feature_label": "Mean Arterial Pressure", "value": 76.0, "importance_weight": -0.088, "direction": "decreases_risk", "explanation_text": "Perfusion pressure is sustained."}
        ]
    }
]


def seed_initial_records(db: Session):
    """Inserts initial demonstration records if the table is currently empty."""
    existing_count = db.query(PredictionRecord).count()
    if existing_count > 0:
        return

    now = datetime.utcnow()
    for case in INITIAL_SEED_CASES:
        created_time = now - timedelta(hours=case["offset_hours"])
        record = PredictionRecord(
            record_id=case["record_id"],
            timestamp=created_time,
            patient_pseudo_id=case["patient_pseudo_id"],
            probability=case["probability"],
            predicted_class=case["predicted_class"],
            predicted_label=case["predicted_label"],
            risk_category=case["risk_category"],
            threshold_used=case["threshold_used"],
            model_version=case["model_version"],
            input_features_json=json.dumps(case["input_features"]),
            top_factors_json=json.dumps(case["top_factors"]),
            notes=case["notes"]
        )
        db.add(record)

    db.commit()
    print(f"Seeded {len(INITIAL_SEED_CASES)} initial demonstration records into SQLite.")
