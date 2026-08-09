# GigScore Unified Prediction Pipeline

> Sprint 7 | Module: `ml/predict.py` | Entry point: `generate_financial_assessment()`

---

## Pipeline Diagram

```
Raw Worker Features (dict)
         │
         ▼
┌─────────────────────────┐
│   Feature Engineering   │  build_feature_vector() + validate_features()
│   ml/utils/             │  → 29-feature canonical vector
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  M1 Financial Stability │  FinancialStabilityAssessment.generate_assessment()
│  ml/m1_scorecard.py     │  → GRS [300–1000], band, pillar scores, top-5 reasons
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  M2 Probability of      │  predict_default_probability()
│  Default                │  → PD ∈ [0,1]  (None if model missing)
│  ml/m2_default_model.py │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  M3 Approval Probability│  predict_approval_probability()
│  ml/m3_approval_model.py│  → P_Approve ∈ [0,1]  (None if model missing)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Loan Amount Estimation │  estimate_max_amount()
│                         │  → ₹5,000 – ₹2,00,000
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Interest Rate          │  estimate_interest_rate()
│  Estimation             │  → 11.0% – 30.0%
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Narrative Generation   │  worker_summary, lender_summary, coaching_actions
│  + Fraud Flag           │  fraud_flag, GigTrust ID
└────────────┬────────────┘
             │
             ▼
     Final Assessment JSON
```

---

## Module Responsibilities

| Module | Role | Output |
|---|---|---|
| `ml/utils/feature_engineering.py` | Schema-driven feature extraction and validation | 29-key feature dict |
| `ml/m1_scorecard.py` | Deterministic 5-pillar scorecard | GRS, band, pillar scores, reasons |
| `ml/m2_default_model.py` | XGBoost binary classifier | PD probability [0,1] |
| `ml/m3_approval_model.py` | Logistic Regression binary classifier | P_Approve [0,1] |
| `ml/explain.py` | Feature importance + SHAP-fallback explainability | importance dict, top reasons |
| `ml/predict.py` | **Orchestrator** — wires all modules | Unified JSON response |

---

## JSON Contract

```json
{
  "gigtrust_id":          "GT-MHF-2026-YNKMX",
  "grs":                  758,
  "grs_band":             "RELIABLE",
  "financial_assessment": "High",
  "default_probability":  0.083,
  "approval_probability": 0.91,
  "max_amount":           32000,
  "interest_rate":        14.5,
  "evidence_quality":     "High",
  "top_5_reasons": [
    "Stable monthly income",
    "Low income volatility",
    "Strong customer ratings",
    "High completion rate",
    "No fraud indicators"
  ],
  "worker_summary":   "Your GigScore of 758 (RELIABLE) reflects high financial stability...",
  "lender_summary":   "Worker GRS: 758 (RELIABLE) | PD: 8.3% | P(Approve): 91.0%...",
  "coaching_actions": [
    "Keep EMI burden below 30% of monthly income",
    "Maintain active working days above 20 per month",
    "Maintain ratings above 4.5 to strengthen service score"
  ],
  "fraud_flag":     false,
  "pillar_scores": {
    "earning": 0.82,
    "continuity": 0.78,
    "service": 0.91,
    "financial": 0.74,
    "integrity": 1.0
  },
  "model_version": "2.0.0-sprint7"
}
```

---

## Amount Estimation Logic

### Formula

```
annual_income  = monthly_income_avg × 12
base_amount    = annual_income × 0.30

grs_factor     = (GRS - 300) / 700          ∈ [0, 1]
approve_factor = P_Approve  (0.5 if missing)
eq_factor      = High → 1.0 | Medium → 0.75 | Low → 0.5

max_amount = base_amount
           × (0.40 + 0.40 × grs_factor + 0.20 × approve_factor)
           × eq_factor
```

Rounded to nearest ₹100. Clamped to **[₹5,000, ₹2,00,000]**.

### Example

| Input | Value |
|---|---|
| `monthly_income_avg` | ₹38,000 |
| `grs` | 758 |
| `p_approve` | 0.91 |
| `evidence_quality` | High |

```
annual_income  = 38,000 × 12 = 4,56,000
base           = 4,56,000 × 0.30 = 1,36,800
grs_factor     = (758 - 300) / 700 = 0.654
approve_factor = 0.91
eq_factor      = 1.0

amount = 1,36,800 × (0.40 + 0.40×0.654 + 0.20×0.91) × 1.0
       = 1,36,800 × (0.40 + 0.262 + 0.182)
       = 1,36,800 × 0.844
       ≈ ₹1,15,400  (clamped to ₹2,00,000 max)
```

---

## Interest Rate Estimation Logic

### Band base ranges

| Band | GRS Range | Base Rate Range |
|---|---|---|
| PRIME | 900–1000 | 11.0% – 13.0% |
| STRONG | 800–899 | 13.0% – 15.0% |
| RELIABLE | 650–799 | 15.0% – 18.0% |
| EMERGING | 500–649 | 18.0% – 24.0% |
| BUILDING | 300–499 | 24.0% – 30.0% |

### Within-band interpolation

Higher GRS within a band → lower rate (linear):

```
t    = (GRS - band_low) / (band_high - band_low)
rate = band_max_rate - t × (band_max_rate - band_min_rate)
```

### PD premium

If `PD > 0.20`:
```
pd_premium = min((PD - 0.20) × 5.0, 3.0)   # +0.5% per 10pt over 20%, cap 3%
rate += pd_premium
```

Final rate clamped to **[11.0%, 30.0%]**, returned to 1 d.p.

---

## GigTrust ID Format

```
GT-<STATE>-<YEAR>-<SUFFIX>

GT   = GigTrust prefix
STATE = 3-char state code (randomly chosen from pool)
YEAR  = 4-digit current year
SUFFIX = 5 uppercase alphanumeric characters
```

Example: `GT-MHF-2026-YNKMX`

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| M2 model `.pkl` missing | `default_probability = null`; pipeline continues |
| M3 model `.pkl` missing | `approval_probability = null`; pipeline continues |
| M2/M3 feature key missing | Same as above; warning logged |
| SHAP not installed | `explain.py` falls back to coefficient-based importance |
| Feature validation warnings | Logged; pipeline continues with available features |

---

## FastAPI Integration

```python
# In api/routes/assess.py
from ml.predict import generate_financial_assessment

@router.post("/assess")
async def assess_worker(payload: WorkerFeaturesRequest):
    result = generate_financial_assessment(payload.dict())
    return JSONResponse(content=result)
```

The function is synchronous and CPU-bound. Wrap in `asyncio.run_in_executor`
or use FastAPI's `BackgroundTasks` for production latency requirements.

### Response time budget (indicative)

| Step | Typical latency |
|---|---|
| Feature engineering | < 1 ms |
| M1 assessment | < 5 ms |
| M2 inference (model cached) | < 20 ms |
| M3 inference (model cached) | < 5 ms |
| Estimation + narrative | < 1 ms |
| **Total** | **< 35 ms** |

---

## Backward Compatibility

`generate_assessment()` is retained as an alias for Sprint 3 callers. It delegates directly to `generate_financial_assessment()`.

```python
# Both of these are equivalent:
from ml.predict import generate_financial_assessment
from ml.predict import generate_assessment
```
