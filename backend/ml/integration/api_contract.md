# GigScore ML — Backend API Contract

> Sprint 8 | For: Chethan (Backend Integration) | Version: 2.0.0-sprint7

---

## Entry Point

```python
from ml.predict import generate_financial_assessment

result = generate_financial_assessment(worker_feature_dict)
```

Call this function **once per worker assessment request**. It is synchronous and CPU-bound. On first call, M2 and M3 model artefacts are loaded from disk and cached in memory for all subsequent calls (~35 ms warm, < 5 ms cached).

---

## Input Schema

```python
worker_feature_dict: dict  # keys defined in ml/models/feature_schema.json
```

All 29 canonical features can be passed. The function accepts additional keys (e.g., `worker_id`) and ignores unknown keys gracefully.

### Minimum required keys

| Key | Type | Notes |
|---|---|---|
| `worker_id` | str | Optional; passed through to output |
| `monthly_income_avg` | float | INR, 3-month rolling avg |
| `income_volatility` | float | CV of monthly income, ≥ 0 |
| `active_day_ratio` | float | [0, 1] |
| `platform_tenure_months` | float | Months since first gig |
| `emi_ratio` | float | EMI / income_avg |
| `bill_payment_ratio` | float | [0, 1] |
| `fraud_indicators` | int | Count of anomalous transactions |
| `identity_verified` | bool | DigiLocker verification status |
| `document_verified` | bool | Document check status |

See [`ml/models/feature_schema.json`](../models/feature_schema.json) for the complete schema with types, bounds, and sources.

---

## Output Fields

```json
{
  "gigtrust_id":           "GT-MHF-2026-YNKMX",
  "grs":                   901,
  "grs_band":              "PRIME",
  "financial_assessment":  "Exceptional",
  "default_probability":   0.0058,
  "approval_probability":  0.4715,
  "max_amount":            103100,
  "interest_rate":         13.0,
  "evidence_quality":      "High",
  "top_5_reasons":         ["..."],
  "worker_summary":        "...",
  "lender_summary":        "...",
  "coaching_actions":      ["..."],
  "fraud_flag":            false,
  "pillar_scores":         {"earning": 0.66, ...},
  "model_version":         "2.0.0-sprint7"
}
```

### Field reference

| Field | Type | Range / Values | Description |
|---|---|---|---|
| `gigtrust_id` | str | `GT-XXX-YYYY-ZZZZZ` | Unique assessment ID |
| `grs` | int | 300–1000 | Gig Reliability Score |
| `grs_band` | str | BUILDING / EMERGING / RELIABLE / STRONG / PRIME | GRS band label |
| `financial_assessment` | str | Low / Moderate / High / Very High / Exceptional | Human label |
| `default_probability` | float \| null | 0–1 or null | P(default) from M2 — null if model not trained |
| `approval_probability` | float \| null | 0–1 or null | P(approve) from M3 — null if model not trained |
| `max_amount` | int | 5000–200000 | Indicative max loan (INR) |
| `interest_rate` | float | 11.0–30.0 | Indicative annual rate (%) |
| `evidence_quality` | str | High / Medium / Low | Data completeness tier |
| `top_5_reasons` | list[str] | 1–5 items | Human-readable positive factors |
| `worker_summary` | str | — | 1-sentence worker-facing summary |
| `lender_summary` | str | — | 2-sentence lender-facing summary |
| `coaching_actions` | list[str] | 3 items | Improvement tips for the worker |
| `fraud_flag` | bool | true / false | True if `fraud_indicators > 0` |
| `pillar_scores` | dict | keys: earning, continuity, service, financial, integrity; values [0,1] | Per-pillar normalised scores |
| `model_version` | str | — | Pipeline version string |

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| M2 model `.pkl` missing | `default_probability = null`; rest of pipeline continues |
| M3 model `.pkl` missing | `approval_probability = null`; rest of pipeline continues |
| Unknown input keys | Silently ignored |
| Missing non-nullable features | Filled with safe defaults; validation warning logged |
| Exception in M2/M3 | Caught; sets field to null; logs error |

The function **never raises** in normal operation. All errors are logged via the internal logger.

---

## FastAPI Endpoints

### POST `/assessment`

Full unified assessment (recommended for all integrations).

```python
@router.post("/assessment")
async def assess_worker(payload: WorkerFeaturesRequest) -> AssessmentResponse:
    result = generate_financial_assessment(payload.dict())
    return JSONResponse(content=result)
```

### POST `/score`

GRS-only lightweight endpoint (call M1 directly if latency is critical).

```python
from ml.m1_scorecard import FinancialStabilityAssessment
from ml.utils.feature_engineering import build_feature_vector

engine = FinancialStabilityAssessment()

@router.post("/score")
async def score_worker(payload: WorkerFeaturesRequest):
    features = build_feature_vector(payload.dict())
    assessment = engine.generate_assessment(features)
    return {"grs": assessment["grs"], "grs_band": assessment["grs_band"]}
```

### POST `/decision`

Binary approval decision at threshold 0.5.

```python
@router.post("/decision")
async def loan_decision(payload: WorkerFeaturesRequest):
    result = generate_financial_assessment(payload.dict())
    approved = (result["approval_probability"] or 0) >= 0.5 and not result["fraud_flag"]
    return {"approved": approved, "grs": result["grs"], "gigtrust_id": result["gigtrust_id"]}
```

---

## Model Loading Behaviour

| Call | Behaviour |
|---|---|
| First call | M2 and M3 models loaded from `ml/models/*.pkl` → cached in memory |
| Subsequent calls | Models served from memory cache; no disk I/O |
| Warm latency | ~35 ms (model load + inference) |
| Cached latency | < 5 ms |

To pre-warm the cache at server startup:

```python
# In FastAPI lifespan / startup event:
from ml.predict import generate_financial_assessment
generate_financial_assessment({"monthly_income_avg": 1})  # warm-up call
```

---

## Deployment Notes

1. **Working directory**: FastAPI server must be launched from `E:\gigworker` so that `from ml.predict import ...` resolves correctly.
2. **Model artefacts**: `ml/models/m2_default.pkl` and `ml/models/m3_approval.pkl` must exist before the server starts. Run `run_training_pipeline()` if absent.
3. **Thread safety**: The module-level `_orchestrator` singleton is stateless between calls. Safe for concurrent requests.
4. **Async**: Wrap in `asyncio.run_in_executor` for high-concurrency deployments to avoid blocking the event loop.
