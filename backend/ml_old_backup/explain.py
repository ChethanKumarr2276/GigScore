import pandas as pd
import joblib
import json
import shap
import matplotlib
matplotlib.use("Agg")  # no GUI needed, just save files
import matplotlib.pyplot as plt

# --- Load trained M2 model ---
bundle = joblib.load("ml/models/m2_default.pkl")
model = bundle["model"]
band_encoder = bundle["band_encoder"]
features = bundle["features"]

# --- Load data and prep same way as training ---
df = pd.read_csv("ml/data/loans.csv")
df["grs_band_encoded"] = band_encoder.transform(df["grs_band"])
X = df[features]

# --- Build SHAP explainer (TreeExplainer is fast + exact for XGBoost) ---
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# --- Global feature importance (mean absolute SHAP value per feature) ---
global_importance = {
    features[i]: float(abs(shap_values[:, i]).mean())
    for i in range(len(features))
}

# --- Global summary plot ---
plt.figure()
shap.summary_plot(shap_values, X, feature_names=features, show=False)
plt.tight_layout()
plt.savefig("ml/outputs/shap_summary_plot.png", dpi=150)
plt.close()

# --- Local explanation for one example worker (row 0) ---
example_idx = 0
example_gigtrust_id = df.iloc[example_idx]["gigtrust_id"]

plt.figure()
shap.plots._waterfall.waterfall_legacy(
    explainer.expected_value,
    shap_values[example_idx],
    feature_names=features,
    show=False
)
plt.tight_layout()
plt.savefig("ml/outputs/shap_waterfall_example.png", dpi=150)
plt.close()

# --- Top 5 reasons for that example (sorted by absolute impact) ---
contributions = list(zip(features, shap_values[example_idx].tolist()))
contributions.sort(key=lambda x: abs(x[1]), reverse=True)
top_5_reasons = [
    {"feature": f, "shap_value": float(v), "direction": "increases risk" if v > 0 else "decreases risk"}
    for f, v in contributions[:5]
]

# --- Export everything ---
output = {
    "global_feature_importance": global_importance,
    "example_gigtrust_id": example_gigtrust_id,
    "example_top_5_reasons": top_5_reasons
}

with open("ml/outputs/shap_explanation.json", "w") as f:
    json.dump(output, f, indent=2)

print("SHAP explainability complete.")
print(json.dumps(output, indent=2))
