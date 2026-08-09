# M3 — Approval Probability Model: Design Document

> Version: 1.0.0 | Sprint: 5 | Module: `ml/m3_approval_model.py`

---

## Objective

Predict the **Probability of Approval (P_Approve)** — the likelihood that a lender should approve a gig worker's loan application. P_Approve is a calibrated float in [0, 1] consumed by:

- `predict.py` public inference entry point
- FastAPI `/assess` endpoint
- Lender dashboard approval recommendation

---

## Target Variable

| Column | Type | Source |
|---|---|---|
| `approved` | int (0/1) | `ml/data/processed/loans.csv` |

`1` = application was approved; `0` = rejected.

---

## Feature Requirements

M3 uses 20 features from the canonical schema (`feature_schema.json`):

### Income (4)
`monthly_income_avg`, `income_volatility`, `income_growth_rate`, `income_trend`

### Activity (4)
`active_day_ratio`, `platform_tenure_months`, `gigs_per_week`, `multi_platform_count`

### Service Quality (4)
`average_rating`, `completion_rate`, `cancellation_rate`, `on_time_rate`

### Financial Health (5)
`existing_emi`, `emi_ratio`, `bill_payment_ratio`, `cash_flow_stability`, `average_month_end_balance`

### Risk / Integrity (3)
`fraud_indicators`, `identity_verified`, `document_verified`

All features must be present in the input dict. Missing values are imputed with column medians during preprocessing. Boolean features are coerced to int before training.

---

## Model Choice

| Model | Role | Reason |
|---|---|---|
| **Logistic Regression** | **Primary (default)** | Interpretable, fast, well-calibrated probabilities, no scaling issues |
| **Random Forest** | Secondary | Available via `use_random_forest=True`; better non-linear capture |

### Why Logistic Regression for M3?

M3 outputs a probability that is directly presented to lenders on the dashboard. Logistic Regression:

1. Produces naturally calibrated probabilities (no Platt scaling needed)
2. Coefficients map directly to feature importance for audit trails
3. Converges in seconds — ideal for a hackathon timeline
4. Paired with `StandardScaler` it handles mixed-scale financial features correctly

### Pipeline architecture

```
Input features
    ↓ StandardScaler()      — zero-mean, unit-variance normalisation
    ↓ LogisticRegression()  — class_weight='balanced', solver='lbfgs'
    ↓ predict_proba()[:, 1] — P_Approve
```

---

## Training Pipeline

```
loans.csv
   ↓ load_data()              — FileNotFoundError if missing
   ↓ preprocess_data()        — select M3 cols, coerce bools, median impute
   ↓ split_data()             — stratified 80/20, seed=42
   ↓ train_model()            — base pipeline + 5-fold CV score (informational)
   ↓ tune_hyperparameters()   — GridSearchCV, cv=5, scoring=roc_auc
   ↓ evaluate_model()         — accuracy, precision, recall, roc_auc, CM
   ↓ save_model()             — ml/models/m3_approval.pkl
   ↓ _save_metrics()          — ml/outputs/m3_metrics.json
```

---

## Hyperparameter Grid (Logistic Regression)

| Parameter | Values searched |
|---|---|
| `classifier__C` | [0.01, 0.1, 1.0, 10.0] |
| `classifier__penalty` | ["l2"] |
| `classifier__solver` | ["lbfgs", "liblinear"] |

Search: `GridSearchCV`, `cv=StratifiedKFold(5)`, `scoring="roc_auc"`, `refit=True`.

Total combinations: **8** — completes in < 5 seconds on typical hardware.

---

## Evaluation Metrics

| Metric | Description |
|---|---|
| **Accuracy** | Overall fraction correctly classified at threshold 0.5 |
| **Precision** | Fraction of predicted approvals that are true approvals |
| **Recall** | Fraction of true approvals correctly identified |
| **ROC-AUC** | Threshold-free ranking quality; primary model selection metric |
| **Confusion Matrix** | [[TN, FP], [FN, TP]] at threshold 0.5 |

### Target thresholds (Sprint 6 hardening)

| Metric | Minimum |
|---|---|
| ROC-AUC | ≥ 0.82 |
| Recall | ≥ 0.75 |
| Precision | ≥ 0.75 |

---

## Output Artifacts

| Artifact | Path | Format |
|---|---|---|
| Trained pipeline | `ml/models/m3_approval.pkl` | joblib pickle (Pipeline) |
| Evaluation metrics | `ml/outputs/m3_metrics.json` | JSON |

### Metrics JSON schema

```json
{
  "model": "LogisticRegression",
  "accuracy": 0.85,
  "precision": 0.84,
  "recall": 0.81,
  "roc_auc": 0.88,
  "confusion_matrix": [[TN, FP], [FN, TP]]
}
```

---

## Inference API

```python
from ml.m3_approval_model import predict_approval_probability

p_approve = predict_approval_probability(feature_dict)
# Returns: float in [0, 1]
```

- Pipeline (scaler + classifier) loaded from disk on first call, then cached.
- All 20 M3 features must be present in `feature_dict`.
- Extra keys (M1-only, M2-only features) are silently ignored.

---

## Integration with predict.py

```python
# In ml/predict.py — Sprint 5 TODO:
from .m3_approval_model import predict_approval_probability

approval_prob = predict_approval_probability(features)
# → returned in response["approval_recommendation"]
```

---

## Differences from M2

| Aspect | M2 (Default) | M3 (Approval) |
|---|---|---|
| Target | `defaulted` | `approved` |
| Algorithm | XGBoost (tree) | Logistic Regression (linear) |
| Tuning | RandomizedSearchCV | GridSearchCV |
| Preprocessing | Median impute | Median impute + StandardScaler |
| Feature count | 20 | 20 (partially overlapping) |
| Probability meaning | P(default) | P(approval) |

---

## Preprocessing Decisions

| Decision | Rationale |
|---|---|
| `StandardScaler` inside Pipeline | Prevents data leakage from test set into scaler fit |
| `class_weight='balanced'` | Handles class imbalance without SMOTE complexity |
| Bool → int coerce | sklearn requires numeric arrays |
| Median imputation | Robust to outliers; preserves distribution shape |
| Pipeline object | Scaler and model serialised together — single `joblib.dump` |

---

## Limitations

1. **Linear decision boundary**: Logistic Regression cannot capture interactions between features (e.g., high income + high fraud). Use Random Forest via `use_random_forest=True` if non-linearity is needed.
2. **No temporal validation**: Random split used; production should use time-ordered walk-forward validation.
3. **Threshold fixed at 0.5**: Lenders may require a different operating point. Threshold calibration deferred to Sprint 6.
4. **Nullable service quality features**: `average_rating`, `on_time_rate` may be missing for new workers; median imputation applies a population-level prior which may not reflect individual risk.
5. **No SHAP**: Coefficient-based importance is available via `pipeline['classifier'].coef_`; SHAP integration is in `explain.py` (Sprint 6).

---

## Future Improvements

- Time-based validation split
- Threshold tuning using precision-recall curve
- SHAP coefficient sign explanation surfaced in lender dashboard
- Isotonic / Platt calibration validation (LogReg is already well-calibrated)
- Model versioning with timestamp suffix
- MLflow experiment tracking
- Fairness audit across worker income bands
