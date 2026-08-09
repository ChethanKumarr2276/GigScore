# GigScore — ML Pipeline

Financial Stability Assessment Engine for Gig Workers.

---

## Overview

GigScore produces a **Gig Reliability Score (GRS)** and an **approval recommendation** for gig-economy workers who lack traditional credit histories. The pipeline combines a rule-based scorecard (M1), a default-risk binary classifier (M2), and a loan-approval model (M3), surfaced through a FastAPI endpoint.

---

## Folder Structure

```
ml/
├── data/
│   ├── raw/            # Unprocessed source files (never committed)
│   ├── processed/      # Feature-engineered CSVs
│   └── README.md
├── models/
│   ├── feature_schema.json   # Canonical feature definitions
│   └── README.md
├── notebooks/
│   └── 01_data_exploration.ipynb
├── outputs/
│   └── README.md
├── utils/
│   ├── __init__.py
│   ├── logger.py
│   └── paths.py
├── config.py
├── explain.py
├── m1_scorecard.py
├── m2_default_model.py
├── m3_approval_model.py
├── predict.py
└── requirements.txt
```

---

## Sprint Roadmap

| Sprint | Scope |
|--------|-------|
| **1 — Foundation** ✅ | Scaffold, config, feature schema, stubs |
| **2 — Ingestion & Features** | Data loaders, feature engineering, `processed/` pipeline |
| **3 — Model Training** | M1 weights, M2 XGBoost, M3 LightGBM, cross-validation |
| **4 — Explainability** | SHAP integration, top-reason extraction |
| **5 — API Integration** | FastAPI endpoint, Pydantic schemas, SQLite logging |
| **6 — Hardening** | Monitoring, drift detection, CI/CD |

---

## Integration Contract

The FastAPI layer calls exactly one function:

```python
from predict import generate_assessment

result = generate_assessment(worker_features: dict) -> dict
```

**Response shape:**

```json
{
  "worker_id": "string | null",
  "grs_score": "float | null",
  "default_probability": "float | null",
  "approval_recommendation": "string | null",
  "evidence_quality": "float | null",
  "top_reasons": "list | null",
  "model_version": "string",
  "status": "string"
}
```

---

## Setup

```bash
# 1. Create and activate virtual environment (Windows)
python -m venv .venv
.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Bootstrap directories
python -c "from utils.paths import ensure_directories; ensure_directories()"
```

---

## Environment

- Python 3.11
- Windows / PowerShell
- All paths resolved relative to `config.PROJECT_ROOT`
