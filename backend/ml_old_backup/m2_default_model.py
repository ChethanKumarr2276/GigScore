import pandas as pd
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score,
    f1_score, confusion_matrix
)
from xgboost import XGBClassifier
from scipy.stats import ks_2samp

# --- Load data ---
df = pd.read_csv("ml/data/loans.csv")

# --- Encode categorical column ---
band_encoder = LabelEncoder()
df["grs_band_encoded"] = band_encoder.fit_transform(df["grs_band"])

FEATURES = ["grs", "grs_band_encoded", "engine_amount", "engine_rate", "sanctioned_amount", "approved"]
TARGET = "defaulted"

X = df[FEATURES]
y = df[TARGET]

# --- Train/validation split ---
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- Train XGBoost model ---
model = XGBClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    eval_metric="logloss",
    random_state=42
)
model.fit(X_train, y_train)

# --- Predict on validation set ---
y_pred_proba = model.predict_proba(X_val)[:, 1]
y_pred = model.predict(X_val)

# --- Evaluation metrics ---
roc_auc = roc_auc_score(y_val, y_pred_proba)
precision = precision_score(y_val, y_pred)
recall = recall_score(y_val, y_pred)
f1 = f1_score(y_val, y_pred)
cm = confusion_matrix(y_val, y_pred).tolist()

# KS Statistic
ks_stat = ks_2samp(y_pred_proba[y_val == 1], y_pred_proba[y_val == 0]).statistic

# --- Feature importance ---
feature_importance = dict(zip(FEATURES, model.feature_importances_.tolist()))

# --- Save model ---
joblib.dump({"model": model, "band_encoder": band_encoder, "features": FEATURES}, "ml/models/m2_default.pkl")

# --- Save metrics (cast everything to plain Python types for JSON) ---
metrics = {
    "roc_auc": float(roc_auc),
    "ks_statistic": float(ks_stat),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1),
    "confusion_matrix": cm,
    "feature_importance": {k: float(v) for k, v in feature_importance.items()}
}

with open("ml/outputs/m2_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("Training complete.")
print(json.dumps(metrics, indent=2))
