# M2 — Probability of Default Model: Design Document

> Version: 1.0.0 | Sprint: 4 | Module: `ml/m2_default_model.py`

---

## Objective

Predict the **Probability of Default (PD)** — the likelihood that a gig worker will fail to repay a loan. PD is a calibrated float in [0, 1] consumed by:

- M1 Financial Stability Assessment (future integration)
- FastAPI `/assess` endpoint
- Lender dashboard risk view

---

## Target Variable

| Column | Type | Source |
|---|---|---|
| `defaulted` | int (0/1) | `ml/data/processed/loans.csv` |

`1` = worker defaulted on the loan; `0` = fully repaid.

---

## Feature Requirements

M2 uses 20 features from the canonical schema (`feature_schema.json`):

### Income (4)
`monthly_income_avg`, `monthly_income_std`, `income_volatility`, `income_per_active_day`

### Activity (5)
`active_day_ratio`, `longest_inactive_gap`, `platform_tenure_months`, `gigs_per_week`

### Service Quality (4)
`average_rating`, `completion_rate`, `cancellation_rate`, `acceptance_rate`

### Financial Health (6)
`existing_emi`, `emi_ratio`, `bill_payment_ratio`, `cash_flow_stability`, `balance_volatility`

### Risk / Integrity (4)
`penalty_events`, `chargebacks`, `fraud_indicators`

All features must be present. Missing values are imputed with column medians during preprocessing.

---

## Model Choice

| Model | Role | Reason |
|---|---|---|
| **XGBoost** (`XGBClassifier`) | Primary | Faster convergence, better handling of sparse credit data |
| **LightGBM** (`LGBMClassifier`) | Fallback | Auto-selected if XGBoost import fails |

The model is selected automatically at runtime via `_build_model()`.

---

## Training Pipeline

```
loans.csv
   ↓ load_data()          — FileNotFoundError if missing
   ↓ preprocess_data()    — select M2 cols, coerce bools, median impute
   ↓ split_data()         — stratified 80/20, seed=42
   ↓ train_model()        — base XGBoost/LightGBM fit
   ↓ tune_hyperparameters() — RandomizedSearchCV (n_iter=20, cv=5, AUC)
   ↓ evaluate_model()     — ROC-AUC, KS, P/R/F1, accuracy, CM
   ↓ save_model()         — ml/models/m2_default.pkl
   ↓ _save_metrics()      — ml/outputs/m2_metrics.json
```

---

## Hyperparameter Search Space

### XGBoost
| Parameter | Values |
|---|---|
| `n_estimators` | [100, 200, 300] |
| `max_depth` | [3, 4, 5, 6] |
| `learning_rate` | [0.01, 0.05, 0.1, 0.2] |
| `subsample` | [0.7, 0.8, 1.0] |
| `colsample_bytree` | [0.7, 0.8, 1.0] |
| `min_child_weight` | [1, 3, 5] |
| `scale_pos_weight` | [1, 2, 3] |

Search: `RandomizedSearchCV`, `n_iter=20`, `cv=StratifiedKFold(5)`, `scoring=roc_auc`.

---

## Evaluation Metrics

| Metric | Description |
|---|---|
| **ROC-AUC** | Primary model quality metric; threshold-free |
| **KS Statistic** | Maximum separation between default / non-default score distributions |
| **Precision** | Fraction of predicted defaults that are true defaults (threshold 0.5) |
| **Recall** | Fraction of true defaults correctly identified |
| **F1 Score** | Harmonic mean of precision and recall |
| **Accuracy** | Overall classification accuracy at threshold 0.5 |
| **Confusion Matrix** | [[TN, FP], [FN, TP]] |

### Target thresholds (Sprint 5 hardening)
| Metric | Minimum |
|---|---|
| ROC-AUC | ≥ 0.78 |
| KS | ≥ 0.35 |
| Recall | ≥ 0.70 |

---

## Output Artifacts

| Artifact | Path | Format |
|---|---|---|
| Trained model | `ml/models/m2_default.pkl` | joblib pickle |
| Evaluation metrics | `ml/outputs/m2_metrics.json` | JSON |

### Metrics JSON schema
```json
{
  "model": "XGBoost",
  "roc_auc": 0.86,
  "ks": 0.41,
  "precision": 0.79,
  "recall": 0.74,
  "f1": 0.76,
  "accuracy": 0.81,
  "confusion_matrix": [[TN, FP], [FN, TP]]
}
```

---

## Inference API

```python
from ml.m2_default_model import predict_default_probability

pd_score = predict_default_probability(feature_dict)
# Returns: float in [0, 1]
```

- Model is loaded from disk on first call and cached in memory.
- All 20 M2 features must be present in `feature_dict`.
- Extra keys (e.g., M1-only features) are silently ignored.

---

## Integration with predict.py

```python
# In ml/predict.py — Sprint 4 TODO:
from .m2_default_model import predict_default_probability

default_prob = predict_default_probability(features)
# → returned in response["default_probability"]
```

---

## Preprocessing Decisions

| Decision | Rationale |
|---|---|
| Median imputation | Robust to outliers; preserves distribution shape |
| Bool → int coerce | sklearn/XGBoost require numeric inputs |
| Stratified split | Ensures class balance in both train and test splits |
| Drop null targets | Cannot train on unknown labels |

---

## Limitations

1. **No temporal validation**: train/test split is random, not time-based. Production should use a walk-forward split.
2. **Static feature set**: M2 uses only 20 of 29 schema features. Service quality features from Platform APIs are nullable and may be missing for many workers.
3. **Threshold fixed at 0.5**: Optimal threshold should be tuned to business cost of false negatives vs. false positives.
4. **No SHAP at training time**: Explainability is deferred to `explain.py` in Sprint 5.
5. **Class imbalance**: `scale_pos_weight` in the search grid partially handles imbalance; SMOTE or class-weight tuning may improve recall.

---

## Future Improvements

- Time-based validation split
- SHAP-based feature importance saved alongside metrics
- Isotonic regression calibration for better probability estimates
- Threshold optimisation using F-beta or cost-sensitive criterion
- Model versioning (save with timestamp suffix)
- MLflow experiment tracking integration
