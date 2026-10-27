import os
import sys

# Ensure project root is in sys.path regardless of current working directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from backend.database import init_db, get_db, DB_PATH
from backend.models import PredictionRecord
from backend.seed_data import seed_initial_records
from backend.schemas import (
    ClinicalObservationInput,
    PredictionResponse,
    ExplainRequest,
    ExplainResponse,
    DashboardStats,
    AnalyticsData,
    HealthCheck
)
from backend.predictor import predictor, ARTIFACTS_DIR
from backend.preprocessing import CLINICAL_FEATURES_META, CORE_FEATURE_NAMES, load_raw_dataset


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event: Initialize DB, seed records, verify predictor."""
    print("SepsisSense AI Backend starting up...")
    init_db()
    
    # Seed initial records if DB is empty
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        seed_initial_records(db)
    finally:
        db.close()

    # Verify predictor
    if not predictor.is_loaded:
        predictor.load_artifacts()

    yield
    print("SepsisSense AI Backend shutting down.")


app = FastAPI(
    title="SepsisSense AI API",
    description="Machine Learning-Based System for Early Sepsis Prediction in ICU Patients",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration strictly allowing local dev frontend
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthCheck, tags=["System"])
def get_health(db: Session = Depends(get_db)):
    """
    Returns actual operational status across all subsystem components:
    FastAPI backend, loaded model, dataset file, SQLite database, and explainability engine.
    """
    total_db_records = db.query(PredictionRecord).count()
    
    # Check dataset
    raw_df, dataset_path = load_raw_dataset()
    dataset_rows = len(raw_df) if raw_df is not None else None
    dataset_status = "operational" if raw_df is not None else "missing"

    # Check model
    model_status = "operational" if (predictor.is_loaded and predictor.model is not None) else "pending"
    model_algorithm = type(predictor.model).__name__ if predictor.model else "Not loaded"
    model_path = os.path.join(ARTIFACTS_DIR, "model.joblib")

    # Check explainability
    explain_status = (
        "operational" if (predictor.explainer and predictor.explainer.shap_explainer)
        else ("operational (proxy fallback)" if predictor.explainer else "unavailable")
    )

    overall_status = "healthy" if (model_status == "operational" and dataset_status == "operational") else "degraded"

    return HealthCheck(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat(),
        backend_version="1.0.0",
        model_status=model_status,
        model_algorithm=model_algorithm,
        model_path=model_path,
        dataset_status=dataset_status,
        dataset_path=dataset_path,
        dataset_rows=dataset_rows,
        database_status="connected",
        total_db_records=total_db_records,
        explainability_status=explain_status,
        endpoints_available=[
            "/health",
            "/api/dashboard",
            "/predict",
            "/explain",
            "/api/analytics",
            "/api/history",
            "/api/stats",
            "/api/features"
        ]
    )


@app.get("/api/dashboard", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Computes real summary KPIs from the database and active dataset metrics.
    """
    # 1. Database record counts
    total_preds = db.query(PredictionRecord).count()
    positive_preds = db.query(PredictionRecord).filter(PredictionRecord.predicted_class == 1).count()
    negative_preds = total_preds - positive_preds
    positive_rate = round((positive_preds / total_preds * 100), 1) if total_preds > 0 else 0.0

    # 2. Risk distribution
    high_count = db.query(PredictionRecord).filter(PredictionRecord.risk_category == "High Risk").count()
    mod_count = db.query(PredictionRecord).filter(PredictionRecord.risk_category == "Moderate Risk").count()
    low_count = db.query(PredictionRecord).filter(PredictionRecord.risk_category == "Low Risk").count()

    # 3. Recent predictions table (latest 8)
    recent = db.query(PredictionRecord).order_by(desc(PredictionRecord.timestamp)).limit(8).all()
    recent_list = [r.to_dict() for r in recent]

    # 4. Activity over time (grouped by day or hour)
    activity_map: Dict[str, Dict[str, int]] = {}
    all_records = db.query(PredictionRecord).order_by(asc(PredictionRecord.timestamp)).all()
    
    for r in all_records:
        day_str = r.timestamp.strftime("%b %d")
        if day_str not in activity_map:
            activity_map[day_str] = {"date": day_str, "positive": 0, "negative": 0, "total": 0}
        if r.predicted_class == 1:
            activity_map[day_str]["positive"] += 1
        else:
            activity_map[day_str]["negative"] += 1
        activity_map[day_str]["total"] += 1

    prediction_activity = list(activity_map.values())

    # 5. Dataset overview from saved metrics
    dataset_overview = predictor.metrics.get("dataset_overview", {})
    if not dataset_overview:
        raw_df, dataset_path = load_raw_dataset()
        if raw_df is not None:
            dataset_overview = {
                "total_observations": len(raw_df),
                "total_features": len([c for c in raw_df.columns if c not in ["SepsisLabel", "Patient_ID", "Unnamed: 0"]]),
                "positive_count": int((raw_df["SepsisLabel"] == 1).sum()),
                "negative_count": int((raw_df["SepsisLabel"] == 0).sum()),
                "positive_rate_percent": round(float((raw_df["SepsisLabel"] == 1).mean() * 100), 2),
                "source": os.path.basename(dataset_path) if dataset_path else "Loaded"
            }
        else:
            dataset_overview = {
                "status": "Dataset not loaded",
                "total_observations": 0,
                "total_features": 0,
                "positive_count": 0,
                "negative_count": 0
            }

    model_status_label = "Active & Operational" if predictor.is_loaded else "Model Evaluation Pending"
    dataset_status_label = "Loaded" if dataset_overview.get("total_observations", 0) > 0 else "Dataset not loaded"

    return DashboardStats(
        total_predictions=total_preds,
        positive_predictions=positive_preds,
        negative_predictions=negative_preds,
        positive_rate_percentage=positive_rate,
        model_status=model_status_label,
        dataset_status=dataset_status_label,
        dataset_overview=dataset_overview,
        risk_distribution={
            "High Risk": high_count,
            "Moderate Risk": mod_count,
            "Low Risk": low_count
        },
        recent_predictions=recent_list,
        prediction_activity=prediction_activity
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_sepsis(obs: ClinicalObservationInput, db: Session = Depends(get_db)):
    """
    Submits clinical observation parameters for model inference.
    Returns estimated probability, predicted class, risk category,
    top contributing features, and logs prediction to SQLite.
    """
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not ready. Please verify artifacts or run train_model.py."
        )

    try:
        response = predictor.predict_observation(obs, db=db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )


@app.post("/explain", response_model=ExplainResponse, tags=["Inference"])
def explain_prediction(payload: ExplainRequest):
    """
    Returns feature contributions for arbitrary clinical feature combinations.
    """
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        X_scaled = predictor.preprocessor.transform_single_dict(payload.features)
        prob = float(predictor.model.predict_proba(X_scaled)[0, 1])

        raw_contributions = predictor.explainer.explain_instance(
            raw_inputs=payload.features,
            scaled_features=X_scaled,
            predicted_probability=prob,
            top_k=8
        )

        return ExplainResponse(
            method=predictor.explainer.method_name,
            base_probability=0.15,
            predicted_probability=prob,
            contributions=raw_contributions,
            notes="Feature contributions describe local model decision weights and do NOT establish clinical causation.",
            disclaimer="Research prototype only. Not for clinical diagnosis."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics", response_model=AnalyticsData, tags=["Analytics"])
def get_analytics():
    """
    Returns comprehensive model evaluation metrics, ROC curve coordinates,
    PR curve coordinates, confusion matrix, and feature importances.
    All calculated from the held-out test evaluation.
    """
    if not predictor.metrics:
        # Try loading metrics.json directly
        metrics_path = os.path.join(ARTIFACTS_DIR, "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                predictor.metrics = json.load(f)
        else:
            raise HTTPException(
                status_code=404,
                detail="Model evaluation pending. Artifacts have not been generated."
            )

    return predictor.metrics


@app.get("/api/history", tags=["History"])
def get_prediction_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    sort_by: str = Query("date_desc"),
    db: Session = Depends(get_db)
):
    """
    Paginated prediction history with search and filtering by risk level.
    """
    query = db.query(PredictionRecord)

    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                PredictionRecord.record_id.ilike(search_filter),
                PredictionRecord.patient_pseudo_id.ilike(search_filter),
                PredictionRecord.notes.ilike(search_filter)
            )
        )

    # Risk category filter
    if risk_category and risk_category != "All":
        query = query.filter(PredictionRecord.risk_category == risk_category)

    # Sorting
    if sort_by == "date_asc":
        query = query.order_by(asc(PredictionRecord.timestamp))
    elif sort_by == "prob_desc":
        query = query.order_by(desc(PredictionRecord.probability))
    elif sort_by == "prob_asc":
        query = query.order_by(asc(PredictionRecord.probability))
    else:  # default date_desc
        query = query.order_by(desc(PredictionRecord.timestamp))

    total_count = query.count()
    total_pages = (total_count + limit - 1) // limit

    records = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_records": total_count,
        "total_pages": total_pages,
        "records": [r.to_dict() for r in records]
    }


@app.get("/api/stats", tags=["Dashboard"])
def get_stats(db: Session = Depends(get_db)):
    """Simple prediction counts endpoint."""
    total = db.query(PredictionRecord).count()
    pos = db.query(PredictionRecord).filter(PredictionRecord.predicted_class == 1).count()
    return {
        "total_predictions": total,
        "positive_predictions": pos,
        "negative_predictions": total - pos
    }


@app.get("/api/features", tags=["Metadata"])
def get_clinical_features():
    """Returns available clinical features metadata for form generation."""
    return {
        "features": CLINICAL_FEATURES_META,
        "feature_names": predictor.feature_names or CORE_FEATURE_NAMES
    }
