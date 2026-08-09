# GigScore — Backend Integration Guide

> For: Chethan | Sprint 8 | Entry point: `ml/predict.py`

---

## Import Statement

```python
from ml.predict import generate_financial_assessment
```

Run your FastAPI server from `E:\gigworker` so the `ml` package is on the Python path.

---

## Example Request

```python
worker_data = {
    "worker_id": "W-DEMO-001",
    "monthly_income_avg": 34200,
    "monthly_income_std": 4200,
    "income_volatility": 0.12,
    "income_growth_rate": 0.06,
    "income_trend": 420.0,
    "income_per_active_day": 1600,
    "active_day_ratio": 0.86,
    "active_days_per_month": 22,
    "longest_inactive_gap": 3,
    "platform_tenure_months": 14,
    "gigs_per_week": 5.1,
    "multi_platform_count": 2,
    "average_rating": 4.8,
    "rating_trend": 0.03,
    "completion_rate": 0.97,
    "cancellation_rate": 0.03,
    "acceptance_rate": 0.91,
    "on_time_rate": 0.95,
    "existing_emi": 4500,
    "emi_ratio": 0.18,
    "bill_payment_ratio": 0.99,
    "cash_flow_stability": 0.83,
    "balance_volatility": 4800,
    "average_month_end_balance": 10500,
    "penalty_events": 0,
    "chargebacks": 0,
    "fraud_indicators": 0,
    "identity_verified": True,
    "document_verified": True,
}

result = generate_financial_assessment(worker_data)
```

---

## Example Response

```json
{
  "gigtrust_id": "GT-DLI-2026-AJI0Y",
  "grs": 901,
  "grs_band": "PRIME",
  "financial_assessment": "Exceptional",
  "default_probability": 0.0058,
  "approval_probability": 0.4715,
  "max_amount": 103100,
  "interest_rate": 13.0,
  "evidence_quality": "High",
  "top_5_reasons": [
    "Verified identity and documents",
    "No fraud indicators",
    "Timely bill payments",
    "High completion rate",
    "Strong customer ratings"
  ],
  "worker_summary": "Your GigScore of 901 (PRIME) reflects exceptional financial stability with high evidence quality. Estimated repayment risk: 1%.",
  "lender_summary": "Worker GRS: 901 (PRIME) | Evidence quality: High | PD: 0.6% | P(Approve): 47.1%. Indicative offer: up to ₹103,100 at 13.0% p.a.",
  "coaching_actions": [
    "Diversify income sources across multiple platforms",
    "Keep EMI burden below 30% of monthly income",
    "Maintain active working days above 20 per month"
  ],
  "fraud_flag": false,
  "pillar_scores": {
    "earning": 0.6614,
    "continuity": 0.8817,
    "service": 0.915,
    "financial": 0.8057,
    "integrity": 1.0
  },
  "model_version": "2.0.0-sprint7"
}
```

---

## Model Loading Behaviour

```python
# First call: loads M2 + M3 from disk (~200 ms cold start)
result = generate_financial_assessment(data)

# Subsequent calls: served from memory cache (< 5 ms)
result = generate_financial_assessment(data)
```

**Pre-warm at server startup** to avoid cold-start latency on the first real request:

```python
# FastAPI lifespan event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm ML models
    from ml.predict import generate_financial_assessment
    generate_financial_assessment({"monthly_income_avg": 1})
    yield
```

---

## Minimal FastAPI Integration

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ml.predict import generate_financial_assessment

app = FastAPI(title="GigScore API")

class WorkerFeatures(BaseModel):
    worker_id: str | None = None
    monthly_income_avg: float = 0.0
    # ... add remaining fields

@app.post("/assessment")
async def assess(payload: WorkerFeatures):
    result = generate_financial_assessment(payload.dict())
    return JSONResponse(content=result)
```

---

## Error Handling

The function **never raises** in normal operation:

| Scenario | Behaviour |
|---|---|
| M2 model missing | `default_probability = null` |
| M3 model missing | `approval_probability = null` |
| Sparse / missing features | Filled with schema defaults; warnings logged |
| Unknown input keys | Silently ignored |

All errors are logged via the internal `ml.predict` logger.

---

## Deployment Checklist

- [ ] Server launched from `E:\gigworker`
- [ ] `ml/models/m2_default.pkl` exists (run `m2_default_model.run_training_pipeline()`)
- [ ] `ml/models/m3_approval.pkl` exists (run `m3_approval_model.run_training_pipeline()`)
- [ ] Pre-warm call added to startup
- [ ] Integration check passes: `python ml/integration/integration_check.py`

---

## Key Files

| File | Purpose |
|---|---|
| [`ml/predict.py`](../predict.py) | Orchestrator — single entry point |
| [`ml/m1_scorecard.py`](../m1_scorecard.py) | GRS engine |
| [`ml/m2_default_model.py`](../m2_default_model.py) | Default probability |
| [`ml/m3_approval_model.py`](../m3_approval_model.py) | Approval probability |
| [`ml/integration/api_contract.md`](api_contract.md) | Full field reference |
| [`ml/integration/sample_input.json`](sample_input.json) | Test input |
| [`ml/integration/sample_output.json`](sample_output.json) | Expected output |
