import numpy as np
from typing import List, Dict, Any, Optional
from backend.preprocessing import CLINICAL_FEATURES_META

# Optional SHAP import with graceful fallback
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False


class SepsisExplainer:
    """
    Computes local feature contributions for individual predictions using SHAP
    or an honest, mathematically sound fallback proxy.
    """
    def __init__(self, model: Any, feature_names: List[str], background_data: Optional[np.ndarray] = None):
        self.model = model
        self.feature_names = feature_names
        self.shap_explainer = None
        self.method_name = "Feature Contribution Engine"
        self._initialize_explainer(background_data)

    def _initialize_explainer(self, background_data: Optional[np.ndarray] = None):
        if not SHAP_AVAILABLE:
            self.method_name = "Standardized Feature Deviation (SHAP library unavailable)"
            return

        try:
            # Check if model has tree structure (RandomForest, XGBoost)
            if hasattr(self.model, "estimators_"):
                self.shap_explainer = shap.TreeExplainer(self.model)
                self.method_name = "SHAP TreeExplainer"
            elif hasattr(self.model, "coef_"):
                # Linear model (Logistic Regression)
                bg = background_data if background_data is not None else np.zeros((1, len(self.feature_names)))
                self.shap_explainer = shap.LinearExplainer(self.model, bg)
                self.method_name = "SHAP LinearExplainer"
            else:
                self.method_name = "Normalized Feature Importance Proxy"
        except Exception as e:
            print(f"SHAP explainer initialization notice: {e}. Using feature-weight contribution fallback.")
            self.shap_explainer = None
            self.method_name = "Standardized Feature Contribution Proxy"

    def explain_instance(
        self,
        raw_inputs: Dict[str, float],
        scaled_features: np.ndarray,
        base_probability: float = 0.15,
        predicted_probability: float = 0.50,
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Calculates local feature contributions for a single observation.
        Returns top positive and negative contributors sorted by impact.
        """
        contributions: List[Dict[str, Any]] = []

        # 1. Attempt SHAP values if explainer is available
        if self.shap_explainer is not None:
            try:
                shap_values = self.shap_explainer.shap_values(scaled_features)
                # TreeExplainer for binary classification may return list of 2 arrays [class_0, class_1]
                if isinstance(shap_values, list) and len(shap_values) == 2:
                    vals = shap_values[1][0]
                elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 2:
                    vals = shap_values[0]
                elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                    vals = shap_values[0, :, 1]
                else:
                    vals = np.array(shap_values).flatten()

                for i, feat in enumerate(self.feature_names):
                    weight = float(vals[i])
                    raw_val = float(raw_inputs.get(feat, 0.0))
                    meta = CLINICAL_FEATURES_META.get(feat, {})
                    label = meta.get("label", feat)
                    unit = meta.get("unit", "")

                    direction = "increases_risk" if weight > 0 else "decreases_risk"
                    
                    # Generate natural clinical explanation text
                    normal_range = meta.get("normal_range", [0, 0])
                    if weight > 0:
                        if normal_range and raw_val > normal_range[1]:
                            reason = f"Elevated {label} ({raw_val} {unit}) is above normal ({normal_range[0]}-{normal_range[1]} {unit}), contributing positively to sepsis likelihood."
                        elif normal_range and raw_val < normal_range[0]:
                            reason = f"Low {label} ({raw_val} {unit}) is below normal ({normal_range[0]}-{normal_range[1]} {unit}), elevating estimated risk."
                        else:
                            reason = f"{label} ({raw_val} {unit}) contributes to an increased model risk score."
                    else:
                        reason = f"{label} ({raw_val} {unit}) is in a favorable or stabilizing physiological range, mitigating risk."

                    contributions.append({
                        "feature": feat,
                        "feature_label": label,
                        "value": raw_val,
                        "importance_weight": round(weight, 4),
                        "direction": direction,
                        "explanation_text": reason
                    })

                # Sort by absolute impact
                contributions.sort(key=lambda x: abs(x["importance_weight"]), reverse=True)
                return contributions[:top_k]

            except Exception as e:
                print(f"SHAP instance explanation fallback: {e}")

        # 2. Honest Fallback Proxy: Model weights or feature importances combined with scaled deviations
        # If Random Forest, use feature_importances_; if Logistic Regression, use coef_
        if hasattr(self.model, "feature_importances_"):
            base_weights = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            base_weights = self.model.coef_[0]
        else:
            base_weights = np.ones(len(self.feature_names)) / len(self.feature_names)

        scaled_vals = scaled_features[0]

        for i, feat in enumerate(self.feature_names):
            raw_val = float(raw_inputs.get(feat, 0.0))
            meta = CLINICAL_FEATURES_META.get(feat, {})
            label = meta.get("label", feat)
            unit = meta.get("unit", "")
            
            # Direction and proxy weight
            # For tree importances (always positive), the sign of scaled value (deviation from mean) determines direction
            if hasattr(self.model, "feature_importances_"):
                # Critical features like Lactate, HR, Resp, WBC, Age increase risk when elevated
                # Features like Platelets, MAP, O2Sat increase risk when depressed
                if feat in ["Platelets", "MAP", "O2Sat", "SBP", "pH"]:
                    impact = -1.0 * scaled_vals[i] * base_weights[i]
                else:
                    impact = scaled_vals[i] * base_weights[i]
            else:
                impact = scaled_vals[i] * base_weights[i]

            direction = "increases_risk" if impact > 0 else "decreases_risk"
            normal_range = meta.get("normal_range", [0, 0])
            
            if impact > 0:
                reason = f"{label} ({raw_val} {unit}) exerts positive weight toward sepsis classification."
            else:
                reason = f"{label} ({raw_val} {unit}) falls within a range that reduces the sepsis risk score."

            contributions.append({
                "feature": feat,
                "feature_label": label,
                "value": raw_val,
                "importance_weight": round(float(impact), 4),
                "direction": direction,
                "explanation_text": reason
            })

        contributions.sort(key=lambda x: abs(x["importance_weight"]), reverse=True)
        return contributions[:top_k]
