import os
import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from datetime import datetime
import json
from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from backend.database import Base


class PredictionRecord(Base):
    """
    Stores individual inference events for auditability, history review,
    and dashboard KPI calculation.
    Does NOT store direct personal identifiable information (PII).
    """
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    patient_pseudo_id = Column(String(64), nullable=True, default="OBS-ANON")
    probability = Column(Float, nullable=False)
    predicted_class = Column(Integer, nullable=False)  # 0 or 1
    predicted_label = Column(String(64), nullable=False)
    risk_category = Column(String(32), nullable=False, index=True)  # Low, Moderate, High
    threshold_used = Column(Float, nullable=False, default=0.40)
    model_version = Column(String(64), nullable=False, default="RandomForest-v1.0")
    
    # Serialized JSON representations of inputs and explainability for audit
    input_features_json = Column(Text, nullable=True)
    top_factors_json = Column(Text, nullable=True)
    notes = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "record_id": self.record_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "patient_pseudo_id": self.patient_pseudo_id,
            "probability": round(self.probability, 4),
            "predicted_class": self.predicted_class,
            "predicted_label": self.predicted_label,
            "risk_category": self.risk_category,
            "threshold_used": self.threshold_used,
            "model_version": self.model_version,
            "input_features": json.loads(self.input_features_json) if self.input_features_json else {},
            "top_factors": json.loads(self.top_factors_json) if self.top_factors_json else [],
            "notes": self.notes,
        }
