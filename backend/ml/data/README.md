# Data Directory

## Expected Datasets

Place source CSV files in `data/raw/`. Processed outputs land in `data/processed/`.

---

## Files & Feature Mapping

### `worker_transactions.csv`

Transaction-level bank statement data sourced from Account Aggregator (AA).

| Feature | Derived From |
|---|---|
| `monthly_income_avg` | Monthly credit sum, 3-month rolling mean |
| `monthly_income_std` | Monthly credit sum, 3-month std |
| `income_volatility` | `monthly_income_std / monthly_income_avg` |
| `income_growth_rate` | Month-over-month delta of net credits |
| `income_trend` | OLS slope of monthly credits over 6 months |
| `income_per_active_day` | Total credits / active day count |
| `active_day_ratio` | Active days / 90 |
| `active_days_per_month` | Active days / months in window |
| `longest_inactive_gap` | Max consecutive days with no credit |
| `gigs_per_week` | Gig-tagged credit rows / weeks in window |
| `emi_ratio` | Outflow EMI rows / `monthly_income_avg` |
| `bill_payment_ratio` | On-time bill debits / total bill debits |
| `cash_flow_stability` | Months with net positive flow / total months |
| `balance_volatility` | Std of daily closing balance |
| `average_month_end_balance` | Mean of month-end closing balances |
| `fraud_indicators` | AA anomaly-flag count on credit rows |

---

### `worker_profiles.csv`

Self-declared and verified identity / onboarding data.

| Feature | Derived From |
|---|---|
| `platform_tenure_months` | `(today - first_platform_date).days / 30` |
| `multi_platform_count` | Distinct platform IDs in profile |
| `identity_verified` | DigiLocker Aadhaar/PAN verification flag |
| `document_verified` | Document check pass flag |
| `existing_emi` | Declared monthly EMI field |

---

### `loans.csv`

Historical loan application and outcome records used for model training labels.

| Column | Purpose |
|---|---|
| `worker_id` | Join key to profiles and transactions |
| `loan_amount` | Requested loan value |
| `approved` | Binary label — M2 / M3 training target |
| `defaulted` | Binary label — M2 default prediction target |
| `assessment_date` | Point-in-time snapshot date for feature window |

---

## Column Naming Convention

All raw CSVs must have a `worker_id` column as the primary key.
Assessment windows are computed relative to each row's `assessment_date`.

---

## gitignore

Add the following to `.gitignore`:

```
ml/data/raw/
ml/data/processed/
```

Track empty directories with `.gitkeep` files only.
