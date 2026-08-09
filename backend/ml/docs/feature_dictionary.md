# GigScore Feature Dictionary

> Schema version: `2.0.0` | Source: `ml/models/feature_schema.json`

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Used by this model |
| — | Not used |

---

## Income Features

| Feature | Type | Source | M1 | M2 | M3 |
|---|---|---|---|---|---|
| `monthly_income_avg` | float | AA | ✅ | ✅ | ✅ |
| `monthly_income_std` | float | AA | ✅ | ✅ | — |
| `income_volatility` | float | AA | ✅ | ✅ | ✅ |
| `income_growth_rate` | float | AA | ✅ | — | ✅ |
| `income_trend` | float | AA | ✅ | — | ✅ |
| `income_per_active_day` | float | AA | ✅ | ✅ | — |

---

## Activity Features

| Feature | Type | Source | M1 | M2 | M3 |
|---|---|---|---|---|---|
| `active_day_ratio` | float | AA | ✅ | ✅ | ✅ |
| `active_days_per_month` | float | AA | ✅ | — | — |
| `longest_inactive_gap` | int | AA | ✅ | ✅ | — |
| `platform_tenure_months` | float | AA | ✅ | ✅ | ✅ |
| `gigs_per_week` | float | AA | ✅ | ✅ | — |
| `multi_platform_count` | int | AA | ✅ | — | ✅ |

---

## Service Quality Features

| Feature | Type | Source | M1 | M2 | M3 |
|---|---|---|---|---|---|
| `average_rating` | float | Future Platform API | ✅ | ✅ | ✅ |
| `rating_trend` | float | Future Platform API | ✅ | — | — |
| `completion_rate` | float | Future Platform API | ✅ | ✅ | ✅ |
| `cancellation_rate` | float | Future Platform API | ✅ | ✅ | ✅ |
| `acceptance_rate` | float | Future Platform API | — | ✅ | — |
| `on_time_rate` | float | Future Platform API | ✅ | — | ✅ |

---

## Financial Health Features

| Feature | Type | Source | M1 | M2 | M3 |
|---|---|---|---|---|---|
| `existing_emi` | float | Bureau | ✅ | ✅ | ✅ |
| `emi_ratio` | float | AA | ✅ | ✅ | ✅ |
| `bill_payment_ratio` | float | AA | ✅ | ✅ | ✅ |
| `cash_flow_stability` | float | AA | ✅ | ✅ | ✅ |
| `balance_volatility` | float | AA | ✅ | ✅ | — |
| `average_month_end_balance` | float | AA | ✅ | — | ✅ |

---

## Risk / Integrity Features

| Feature | Type | Source | M1 | M2 | M3 |
|---|---|---|---|---|---|
| `penalty_events` | int | Future Platform API | ✅ | ✅ | ✅ |
| `chargebacks` | int | Future Platform API | ✅ | ✅ | — |
| `fraud_indicators` | int | AA | ✅ | ✅ | ✅ |
| `identity_verified` | bool | Self-declared | ✅ | — | ✅ |
| `document_verified` | bool | Self-declared | ✅ | — | ✅ |

---

## Source Glossary

| Source | Description |
|---|---|
| **AA** | Account Aggregator — bank statement data via RBI AA framework |
| **Bureau** | Credit bureau pull (CIBIL / Experian) |
| **Self-declared** | Worker-submitted documents verified in-app |
| **Future Platform API** | Planned integration with Ola, Swiggy, Urban Company APIs |
