# GigScore — End-to-End Validation Guide

> Sprint 8 | Module: `ml/integration/integration_check.py`

---

## Pipeline Data Flow

```
worker_transactions.csv   worker_profiles.csv   loans.csv
         │                        │                  │
         └────────────────────────┴──────────────────┘
                                  │
                         Feature Engineering
                    (build_feature_vector / validate_features)
                                  │
                         M1 — Financial Stability
                    (FinancialStabilityAssessment)
                         GRS [300–1000] + Band
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
               M2 — Default               M3 — Approval
          (XGBoost Classifier)       (Logistic Regression)
              PD ∈ [0, 1]              P_Approve ∈ [0, 1]
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                      Amount & Rate Estimation
                      Narrative Generation
                      GigTrust ID
                                  │
                         JSON Assessment
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             Worker Dashboard            Lender Dashboard
         (GRS, reasons, coaching)  (PD, P_Approve, offer terms)
```

---

## Running the Integration Check

```bash
# From E:\gigworker
python ml/integration/integration_check.py
```

Expected output:

```
============================================================
GigScore ML Pipeline — Integration Check
============================================================
Input  : sample_input.json  (worker_id=W-DEMO-001)
Output : GRS=901  band=PRIME  amount=Rs.103,100  rate=13.0%

Integration: PASS
Inference  : 38.4 ms
```

Exit code `0` = PASS. Exit code `1` = FAIL (errors printed).

---

## Validation Checklist

### Field Presence
- [ ] `gigtrust_id` present and starts with `GT-`
- [ ] `grs` present as int
- [ ] `grs_band` in {BUILDING, EMERGING, RELIABLE, STRONG, PRIME}
- [ ] `financial_assessment` present as string
- [ ] `default_probability` is float [0,1] or null
- [ ] `approval_probability` is float [0,1] or null
- [ ] `max_amount` present as int
- [ ] `interest_rate` present as float
- [ ] `evidence_quality` in {High, Medium, Low}
- [ ] `top_5_reasons` is list with 1–5 items
- [ ] `worker_summary` is non-empty string
- [ ] `lender_summary` is non-empty string
- [ ] `coaching_actions` is list with ≥ 1 item
- [ ] `fraud_flag` is boolean
- [ ] `pillar_scores` dict with 5 keys each in [0, 1]
- [ ] `model_version` present as string

### Value Ranges
- [ ] GRS: 300 ≤ grs ≤ 1000
- [ ] PD: 0 ≤ default_probability ≤ 1 (or null)
- [ ] P_Approve: 0 ≤ approval_probability ≤ 1 (or null)
- [ ] Interest: 11.0 ≤ interest_rate ≤ 30.0
- [ ] Amount: 5,000 ≤ max_amount ≤ 2,00,000

### Hard Cap Validation
- [ ] Workers with `fraud_indicators > 0` → GRS ≤ 450
- [ ] Workers with `identity_verified = False` → GRS ≤ 550
- [ ] Workers with `platform_tenure_months < 1` → GRS ≤ 650

### Error Resilience
- [ ] Call succeeds when M2 model is absent → `default_probability = null`
- [ ] Call succeeds when M3 model is absent → `approval_probability = null`
- [ ] Sparse feature dict (many nulls) → pipeline completes with warnings

---

## Latency Target

| Component | Budget |
|---|---|
| Feature engineering | < 1 ms |
| M1 assessment | < 5 ms |
| M2 inference (cached) | < 20 ms |
| M3 inference (cached) | < 5 ms |
| Estimation + narrative | < 1 ms |
| **End-to-end (cached)** | **< 35 ms** |
| **End-to-end (cold start)** | **< 300 ms** |

Cold start includes loading M2/M3 from disk (~200 ms). Pre-warm at server startup to achieve < 35 ms for all subsequent calls.

---

## Demo Profile Validation

Run all three demo profiles:

```python
import json
from ml.predict import generate_financial_assessment

profiles = json.load(open("ml/integration/demo_profiles.json"))
for p in profiles:
    result = generate_financial_assessment(p)
    print(p["_profile"], "→ GRS:", result["grs"], result["grs_band"])
```

Expected bands:

| Profile | Expected Band |
|---|---|
| PRIME worker | PRIME or STRONG |
| RELIABLE worker | RELIABLE or STRONG |
| BUILDING worker | BUILDING or EMERGING |
