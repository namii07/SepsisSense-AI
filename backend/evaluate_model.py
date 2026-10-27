import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, roc_curve, auc, confusion_matrix
)


def evaluate_binary_model(
    model: Any,
    X_test_scaled: np.ndarray,
    y_test: np.ndarray,
    threshold: float = 0.40,
    model_name: str = "Trained Classifier"
) -> Dict[str, Any]:
    """
    Evaluates a trained classifier on held-out test data.
    Computes all standard metrics, confusion matrix, and downsampled ROC/PR curves
    for responsive web visualization.
    """
    # Prediction probabilities for class 1 (Sepsis Positive)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    y_pred = (y_prob >= threshold).astype(int)

    # Core scalar metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))

    try:
        roc_auc = float(roc_auc_score(y_test, y_prob))
    except Exception:
        roc_auc = 0.50

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

    # ROC Curve calculation & downsampling
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_curve_sampled: List[Dict[str, float]] = []
    # Downsample to ~35 smooth points for Recharts
    indices = np.linspace(0, len(fpr) - 1, min(35, len(fpr)), dtype=int)
    for idx in indices:
        roc_curve_sampled.append({
            "fpr": round(float(fpr[idx]), 4),
            "tpr": round(float(tpr[idx]), 4)
        })

    # PR Curve calculation & downsampling
    pr_precision, pr_recall, _ = precision_recall_curve(y_test, y_prob)
    pr_auc = float(auc(pr_recall, pr_precision))
    
    pr_curve_sampled: List[Dict[str, float]] = []
    pr_indices = np.linspace(0, len(pr_recall) - 1, min(35, len(pr_recall)), dtype=int)
    for idx in pr_indices:
        pr_curve_sampled.append({
            "recall": round(float(pr_recall[idx]), 4),
            "precision": round(float(pr_precision[idx]), 4)
        })

    return {
        "model_name": model_name,
        "threshold": threshold,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": {
                "tn": tn,
                "fp": fp,
                "fn": fn,
                "tp": tp
            }
        },
        "roc_curve": roc_curve_sampled,
        "pr_curve": pr_curve_sampled
    }
