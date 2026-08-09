import pandas as pd
import json
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, roc_auc_score,
    roc_curve
)

# --- Load data ---
df = pd.read_csv("ml/data/loans.csv")

# --- Encode categorical column ---
band_encoder = LabelEncoder()
df["grs_band_encoded"] = band_encoder.fit_transform(df["grs_band"])

FEATURES = ["grs", "grs_band_encoded", "engine_amount", "engine_rate"]
TARGET = "approved"

X = df[FEATURES]
y = df[TARGET]

# --- Train/validation split ---
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- Scale features (Logistic Regression needs this) ---
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# --- Train Logistic Regression ---
model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

# --- Predict on validation set ---
y_pred_proba = model.predict_proba(X_val_scaled)[:, 1]

# --- Threshold optimization: find threshold that maximizes accuracy ---
best_threshold = 0.5
best_accuracy = 0
for t in np.arange(0.1, 0.9, 0.01):
    preds = (y_pred_proba >= t).astype(int)
    acc = accuracy_score(y_val, preds)
    if acc > best_accuracy:
        best_accuracy = acc
        best_threshold = t

y_pred_final = (y_pred_proba >= best_threshold).astype(int)

# --- Evaluation metrics ---
accuracy = accuracy_score(y_val, y_pred_final)
precision = precision_score(y_val, y_pred_final)
recall = recall_score(y_val, y_pred_final)
roc_auc = roc_auc_score(y_val, y_pred_proba)

# --- Save model ---
joblib.dump({
    "model": model,
    "scaler": scaler,
    "band_encoder": band_encoder,
    "features": FEATURES,
    "threshold": float(best_threshold)
}, "ml/models/m3_approval.pkl")

# --- Save metrics ---
metrics = {
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "roc_auc": float(roc_auc),
    "optimal_threshold": float(best_threshold)
}

with open("ml/outputs/m3_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("Training complete.")
print(json.dumps(metrics, indent=2))
