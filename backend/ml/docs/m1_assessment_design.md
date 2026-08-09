# M1 — Financial Stability Assessment Engine: Design Document

> Version: 1.0.0 | Sprint: 3 | Module: `ml/m1_scorecard.py`

---

## Overview

M1 is a **deterministic, weighted scorecard engine**. It evaluates a gig worker across five pillars and produces a Gig Reliability Score (GRS) on a 300–1000 scale. It contains **no ML training, no randomness, and no external dependencies** beyond the standard library.

---

## Pillar Definitions & Weights

| # | Pillar | Weight | Features Used |
|---|---|---|---|
| 1 | Earning Power & Stability | **25%** | `monthly_income_avg`, `monthly_income_std`, `income_volatility`, `income_growth_rate`, `income_trend`, `income_per_active_day` |
| 2 | Work Volume & Continuity | **20%** | `active_day_ratio`, `active_days_per_month`, `longest_inactive_gap`, `platform_tenure_months`, `gigs_per_week` |
| 3 | Service Quality | **20%** | `average_rating`, `rating_trend`, `completion_rate`, `cancellation_rate`, `acceptance_rate`, `on_time_rate` |
| 4 | Financial Health & Debt Burden | **20%** | `existing_emi`, `emi_ratio`, `bill_payment_ratio`, `cash_flow_stability`, `balance_volatility`, `average_month_end_balance` |
| 5 | Integrity & Verification | **15%** | `penalty_events`, `chargebacks`, `fraud_indicators`, `identity_verified`, `document_verified` |

All pillar scores are normalised to **[0, 1]**.

---

## Pillar Scoring Logic

### Pillar 1 — Earning Power & Stability (0.25)

| Sub-component | Weight | Logic |
|---|---|---|
| Income adequacy | 35% | Sigmoid centred at ₹20,000/month; `1 / (1 + exp(-((income_avg - 20000) / 10000)))` |
| Volatility | 30% | `clamp(1 - volatility / 0.5, 0, 1)` — penalises CV > 0.5 |
| Growth rate | 15% | `clamp((growth_rate + 0.1) / 0.6, 0, 1)` |
| Income trend | 10% | `clamp(0.5 + trend / 5000, 0, 1)` — positive slope rewarded |
| Per-active-day income | 10% | Sigmoid centred at ₹1,500/day |

### Pillar 2 — Work Volume & Continuity (0.20)

| Sub-component | Weight | Logic |
|---|---|---|
| Active day ratio | 25% | Direct [0,1] value |
| Active days/month | 20% | `clamp(days / 20, 0, 1)` — full credit at ≥ 20 days/month |
| Longest inactive gap | 20% | `clamp(1 - (gap - 7) / 23, 0, 1)` — penalises gaps > 7 days |
| Platform tenure | 20% | `clamp(months / 24, 0, 1)` — full credit at ≥ 24 months |
| Gigs per week | 15% | `clamp(gigs / 5, 0, 1)` — full credit at ≥ 5/week |

### Pillar 3 — Service Quality (0.20)

| Sub-component | Weight | Logic |
|---|---|---|
| Average rating | 30% | `(rating - 1) / 4` → [0,1] |
| Rating trend | 10% | `clamp(0.5 + trend / 0.5, 0, 1)` |
| Completion rate | 25% | Direct [0,1] |
| Cancellation rate | 15% | `1 - cancellation_rate` |
| Acceptance rate | 10% | Direct [0,1] |
| On-time rate | 10% | Direct [0,1] |

### Pillar 4 — Financial Health & Debt Burden (0.20)

| Sub-component | Weight | Logic |
|---|---|---|
| EMI ratio | 30% | `clamp(1 - emi_ratio / 0.7, 0, 1)` — penalises ratio > 0.7 |
| Bill payment ratio | 25% | Direct [0,1] |
| Cash flow stability | 20% | Direct [0,1] |
| Balance volatility | 15% | `clamp(1 - (std / income_avg) / 0.5, 0, 1)` |
| Month-end balance | 10% | `clamp((balance / income_avg) / 0.5, 0, 1)` |

### Pillar 5 — Integrity & Verification (0.15)

| Sub-component | Weight | Logic |
|---|---|---|
| Penalty events | 25% | `clamp(1 - events / 3, 0, 1)` |
| Chargebacks | 25% | `clamp(1 - chargebacks / 3, 0, 1)` |
| Fraud indicators | 25% | `0` if any fraud flag; `1` otherwise |
| Identity verified | 15% | `1` if verified; `0` otherwise |
| Document verified | 10% | `1` if verified; `0` otherwise |

---

## GRS Formula

```
raw_score = 0.25 × earning
          + 0.20 × continuity
          + 0.20 × service
          + 0.20 × financial
          + 0.15 × integrity

GRS = round(300 + 700 × (raw_score ^ 0.85))
GRS = clamp(GRS, 300, 1000)
```

The power transform (`^ 0.85`) compresses high scores and expands the mid-range, producing a more discriminative distribution across the 300–1000 band.

---

## Hard Risk Caps

Applied **after** the formula. Any matching condition overrides GRS downward.

| Condition | Maximum GRS |
|---|---|
| `fraud_indicators > 0` | **450** |
| `identity_verified == False` | **550** |
| `platform_tenure_months < 1` | **650** |

Multiple caps stack: the lowest applicable cap wins.

---

## Assessment Bands

| GRS Range | Band | Financial Assessment Label |
|---|---|---|
| 900–1000 | PRIME | Exceptional |
| 800–899 | STRONG | Very High |
| 650–799 | RELIABLE | High |
| 500–649 | EMERGING | Moderate |
| 300–499 | BUILDING | Low |

---

## Evidence Quality Rules

| Tier | Conditions |
|---|---|
| **High** | `platform_tenure_months >= 12` AND `multi_platform_count >= 2` AND `identity_verified` AND `document_verified` |
| **Medium** | `platform_tenure_months >= 6` OR `identity_verified` |
| **Low** | All other cases (new worker, incomplete verification) |

---

## Top-5 Reasons

Reasons are selected from a fixed candidate pool based on feature thresholds:

| Reason | Trigger Condition |
|---|---|
| Stable monthly income | `monthly_income_avg >= 20,000` |
| Low income volatility | `income_volatility <= 0.25` |
| Consistent work activity | `active_day_ratio >= 0.60` |
| Long platform tenure | `platform_tenure_months >= 12` |
| Strong customer ratings | `average_rating >= 4.0` |
| High completion rate | `completion_rate >= 0.90` |
| Low existing debt burden | `emi_ratio <= 0.30` |
| Timely bill payments | `bill_payment_ratio >= 0.85` |
| Strong cash flow stability | `cash_flow_stability >= 0.75` |
| Verified identity and documents | `identity_verified AND document_verified` |
| No fraud indicators | `fraud_indicators == 0` |

Candidates are ranked by their normalised signal strength. The top 5 are returned.

---

## Assumptions

1. All features are pre-validated by `ml/utils/feature_engineering.py` before M1 receives them.
2. Missing nullable features default to a neutral mid-range value (not zero) to avoid unfair penalisation.
3. Missing non-nullable features default to zero, which reflects worst-case for that signal.
4. Hard caps are applied in order; if multiple apply, the strictest (lowest) cap wins.
5. `income_avg = 0` is treated as a signal of no data, not zero income, to avoid division-by-zero in financial pillar.
6. Service quality features from Platform APIs may be `None` for new workers; defaults (e.g., rating = 3.0) reflect a neutral prior.

---

## Integration Contract

```python
from ml.m1_scorecard import FinancialStabilityAssessment

engine = FinancialStabilityAssessment()
result = engine.generate_assessment(feature_dict)
```

**Output shape:**

```json
{
  "grs": 758,
  "grs_band": "RELIABLE",
  "financial_assessment": "High",
  "evidence_quality": "High",
  "pillar_scores": {
    "earning": 0.82,
    "continuity": 0.78,
    "service": 0.91,
    "financial": 0.74,
    "integrity": 1.0
  },
  "top_5_reasons": [
    "Stable monthly income",
    "Low income volatility",
    "Strong customer ratings",
    "High completion rate",
    "No fraud indicators"
  ]
}
```

---

## Future Work

- Sprint 4: Combine M1 GRS with Chethan's M2 `default_probability` and M3 `approval_recommendation` in `predict.py`.
- Sprint 5: SHAP-based explainability layer wrapping M2/M3 in `explain.py`.
- Sprint 6: Drift monitoring on pillar score distributions.
