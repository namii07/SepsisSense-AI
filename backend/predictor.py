import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
import joblib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.preprocessing import ClinicalPreprocessor, CLINICAL_FEATURES_META, CORE_FEATURE_NAMES
from backend.explainability import SepsisExplainer
from backend.models import PredictionRecord
from backend.schemas import ClinicalObservationInput, PredictionResponse, FeatureContribution

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")


class SepsisPredictor:
    """
    Singleton service managing model inference, explainability generation,
    and database record persistence.
    """
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = []
        self.metrics = {}
        self.explainer = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        """Loads artifacts from disk; if missing, triggers pipeline training."""
        model_path = os.path.join(ARTIFACTS_DIR, "model.joblib")
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
        metrics_path = os.path.join(ARTIFACTS_DIR, "metrics.json")
        features_path = os.path.join(ARTIFACTS_DIR, "features.json")

        if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(metrics_path)):
            print("Model artifacts not found on startup. Executing initial training pipeline...")
            try:
                from backend.train_model import train_and_save_pipeline
                train_and_save_pipeline()
            except Exception as e:
                print(f"Warning: automatic training pipeline error: {e}")

        try:
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.preprocessor = joblib.load(scaler_path)
                
                if os.path.exists(features_path):
                    with open(features_path, "r") as f:
                        feat_data = json.load(f)
                        self.feature_names = feat_data.get("feature_names", CORE_FEATURE_NAMES)
                else:
                    self.feature_names = CORE_FEATURE_NAMES

                if os.path.exists(metrics_path):
                    with open(metrics_path, "r") as f:
                        self.metrics = json.load(f)

                # Initialize explainer
                self.explainer = SepsisExplainer(self.model, self.feature_names)
                self.is_loaded = True
                print(f"SepsisPredictor loaded successfully. Algorithm: {type(self.model).__name__}")
        except Exception as e:
            print(f"Error loading model artifacts: {e}")
            self.is_loaded = False

    def predict_observation(
        self,
        obs: ClinicalObservationInput,
        db: Optional[Session] = None
    ) -> PredictionResponse:
        """
        Executes prediction, computes feature contributions, saves to SQLite,
        and returns validated prediction response.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model artifacts are not loaded. Run train_model.py first.")

        # Extract dictionary from input
        obs_dict = obs.dict()
        pseudo_id = obs.patient_pseudo_id or f"OBS-{uuid.uuid4().hex[:6].upper()}"

        # Standardize and scale input
        X_scaled = self.preprocessor.transform_single_dict(obs_dict)

        # Model inference
        prob_array = self.model.predict_proba(X_scaled)
        prob_sepsis = float(prob_array[0, 1])
        prob_percentage = round(prob_sepsis * 100.0, 1)

        # Threshold check
        threshold = self.metrics.get("primary_metrics", {}).get("threshold", 0.40)
        predicted_class = 1 if prob_sepsis >= threshold else 0
        predicted_label = "Sepsis Prediction Positive" if predicted_class == 1 else "Sepsis Prediction Negative"

        # Risk categorization rule
        if prob_percentage < 30.0:
            risk_category = "Low Risk"
        elif prob_percentage < 50.0:
            risk_category = "Moderate Risk"
        else:
            risk_category = "High Risk"

        # Interpretation explanation
        if predicted_class == 1:
            interpretation = (
                f"Model estimates a {prob_percentage}% probability of sepsis, exceeding the experimental "
                f"classification threshold of {int(threshold * 100)}%. Systemic inflammatory response and/or organ "
                f"dysfunction markers warrant immediate clinical evaluation."
            )
        else:
            interpretation = (
                f"Model estimates a {prob_percentage}% probability of sepsis, remaining below the experimental "
                f"classification threshold of {int(threshold * 100)}%. Vital signs and laboratory parameters reflect "
                f"lower acute sepsis likelihood based on ICU observational profiles."
            )

        # Compute explainability contributions
        contributions_raw = []
        if self.explainer:
            contributions_raw = self.explainer.explain_instance(
                raw_inputs=obs_dict,
                scaled_features=X_scaled,
                predicted_probability=prob_sepsis,
                top_k=6
            )

        feature_contributions = [
            FeatureContribution(
                feature=c["feature"],
                feature_label=c["feature_label"],
                value=c["value"],
                importance_weight=c["importance_weight"],
                direction=c["direction"],
                explanation_text=c["explanation_text"]
            )
            for c in contributions_raw
        ]

        record_id = f"PRED-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        timestamp_str = datetime.utcnow().isoformat()

        # Persist to SQLite if DB session is provided
        if db is not None:
            try:
                db_record = PredictionRecord(
                    record_id=record_id,
                    timestamp=datetime.utcnow(),
                    patient_pseudo_id=pseudo_id,
                    probability=prob_sepsis,
                    predicted_class=predicted_class,
                    predicted_label=predicted_label,
                    risk_category=risk_category,
                    threshold_used=threshold,
                    model_version=f"RandomForest-v1.0 ({self.explainer.method_name})",
                    input_features_json=json.dumps(obs_dict),
                    top_factors_json=json.dumps(contributions_raw),
                    notes="Demonstration observation" if obs.is_demo else "Clinical observation submission"
                )
                db.add(db_record)
                db.commit()
                db.refresh(db_record)
            except Exception as e:
                db.rollback()
                print(f"Error persisting prediction record to SQLite: {e}")

        return PredictionResponse(
            record_id=record_id,
            timestamp=timestamp_str,
            patient_pseudo_id=pseudo_id,
            probability=round(prob_sepsis, 4),
            probability_percentage=prob_percentage,
            predicted_class=predicted_class,
            predicted_label=predicted_label,
            risk_category=risk_category,
            classification_threshold=threshold,
            model_version="RandomForest-v1.0",
            model_algorithm="RandomForestClassifier(n_estimators=120, balanced)",
            interpretation=interpretation,
            feature_contributions=feature_contributions,
            disclaimer=(
                "EXPERIMENTAL RESEARCH PROTOTYPE ONLY: Predictions are probabilistic estimates produced by a machine learning model "
                "for educational and academic evaluation. This system is NOT a diagnostic medical device and must never be used "
                "for clinical decision-making or patient treatment."
            )
        )


# Global predictor instance
predictor = SepsisPredictor()
