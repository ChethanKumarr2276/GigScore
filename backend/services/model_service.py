import joblib
import pandas as pd
import shap


def get_m1_financial_assessment(gigtrust_id: str):
    """
    TEMPORARY MOCK — replace with Shreesha's real M1 call once available.
    Expected real output: financial stability rating + evidence quality.
    """
    return {
        "financial_assessment": "STABLE",
        "evidence_quality": "MEDIUM"
    }


class ModelService:
    def __init__(self):
        self.m2_bundle = None
        self.m3_bundle = None
        self.m2_explainer = None
        self.loaded = False

    def load_models(self):
        # --- Load M2 (default risk) ---
        self.m2_bundle = joblib.load("ml/models/m2_default.pkl")

        # --- Load M3 (approval probability) ---
        self.m3_bundle = joblib.load("ml/models/m3_approval.pkl")

        # --- Build SHAP explainer once, reused for every request ---
        self.m2_explainer = shap.TreeExplainer(self.m2_bundle["model"])

        self.loaded = True
        print("M2, M3, and SHAP explainer loaded successfully.")

    def predict_default(self, grs, grs_band, engine_amount, engine_rate, sanctioned_amount, approved):
        model = self.m2_bundle["model"]
        band_encoder = self.m2_bundle["band_encoder"]
        features = self.m2_bundle["features"]

        grs_band_encoded = band_encoder.transform([grs_band])[0]

        row = pd.DataFrame([{
            "grs": grs,
            "grs_band_encoded": grs_band_encoded,
            "engine_amount": engine_amount,
            "engine_rate": engine_rate,
            "sanctioned_amount": sanctioned_amount,
            "approved": approved
        }])[features]

        pd_probability = float(model.predict_proba(row)[0][1])

        shap_values = self.m2_explainer.shap_values(row)
        contributions = list(zip(features, shap_values[0].tolist()))
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        top_reasons = [
            {"feature": f, "shap_value": float(v), "direction": "increases risk" if v > 0 else "decreases risk"}
            for f, v in contributions[:5]
        ]

        return {
            "probability_of_default": pd_probability,
            "top_reasons": top_reasons
        }

    def predict_approval(self, grs, grs_band, engine_amount, engine_rate):
        model = self.m3_bundle["model"]
        scaler = self.m3_bundle["scaler"]
        band_encoder = self.m3_bundle["band_encoder"]
        features = self.m3_bundle["features"]
        threshold = self.m3_bundle["threshold"]

        grs_band_encoded = band_encoder.transform([grs_band])[0]

        row = pd.DataFrame([{
            "grs": grs,
            "grs_band_encoded": grs_band_encoded,
            "engine_amount": engine_amount,
            "engine_rate": engine_rate
        }])[features]

        row_scaled = scaler.transform(row)
        p_approve = float(model.predict_proba(row_scaled)[0][1])
        approved = bool(p_approve >= threshold)

        return {
            "p_approve": p_approve,
            "approved_prediction": approved
        }


# --- Singleton instance used across the app ---
model_service = ModelService()
