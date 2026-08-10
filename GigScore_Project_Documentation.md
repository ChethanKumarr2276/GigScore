# PROJECT DOCUMENTATION

## GigScore — AI-Powered Micro-Credit Assessment for Gig Workers

| | |
|---|---|
| **Team Name** | Victus |
| **Team Leader** | Shraddha Shetty GR |
| **Contact** | +91 90715 53376 |
| **Event Name** | HackMatrix 2026 — Round 2 |
| **Problem Statement** | AI-powered micro-credit assessment for gig workers lacking formal credit history |

---

## Links

- **GitHub Repository:** https://github.com/ChethanKumarr2276/GigScore
- **Live Deployed Link:** https://gig-score-two.vercel.app
- **Live Backend API:** https://gigscore.onrender.com/docs
- **Demo Video Link:** *[to be added]*
- **Presentation Link:** *[to be added]*

---

## Project Name / Title

**GigScore — AI-Powered Micro-Credit Assessment for Gig Workers**

---

## Platform Preview

The platform is live and publicly deployed. It consists of two portals served by a single FastAPI backend:

- **Worker Portal** — a gig worker logs in, views their GigScore Reliability Score (GRS), a pillar-level breakdown of what drives it, a fraud-check status, personalized financial coaching, and their loan/application status.
- **Lender Portal** — a lender views a full applicant queue sortable by GRS, portfolio-wide analytics, a Portfolio Risk Exposure dashboard (₹ exposure, expected loss, flagged applicants), and approves or rejects loan applications with a full audit trail.

- Frontend deployed on Vercel: https://gig-score-two.vercel.app
- Backend deployed on Render: https://gigscore.onrender.com

*The live demo currently serves a real (non-mocked) dataset of 1,009 gig worker profiles and assessments.*

---

## Summary

GigScore assesses gig-worker creditworthiness using alternative data — cross-platform earnings, active-day continuity, service quality, and platform diversity — instead of bureau history or payslips. A three-stage ML pipeline (a rules-based scorecard, a default-probability model, and an approval model) produces a GRS score on a 300–1000 scale, a probability of default, and a suggested loan amount, each with full explainability. A FastAPI backend serves this to two React portals — one for gig workers, one for lenders — backed by a real, non-mocked dataset of roughly 1,009 workers and assessments.

---

## Problem Being Solved

India's gig economy — delivery riders, cab drivers, freelance platform workers — is large and growing, but almost entirely excluded from formal credit. Traditional underwriting requires:

- 6+ months of formal payslips tied to a single employer
- Consistent statements from one primary bank account
- A fixed monthly salary, not variable daily gig earnings
- Existing loan or credit card history most gig workers simply don't have

None of these match how a gig worker actually earns. The result is a large, income-earning, genuinely creditworthy population that remains invisible to lenders — not because they are risky, but because the scoring infrastructure was never built for how they work.

---

## USP (Unique Selling Point)

- Uses real-time cross-platform earnings velocity instead of static payslips.
- Evaluates multi-homing stability across linked gig platforms, rather than requiring a single employer.
- Scores behavioral evidence — active days, ratings, service quality — as core inputs, not afterthoughts.
- No single-employer or fixed-salary requirement anywhere in the scoring model.
- Full explainability: every score ships with a 5-pillar breakdown and a fraud-check flag, not a black-box number.
- Fully deterministic scoring — identical inputs always produce identical, reproducible outputs, which matters for lender trust and auditability.

---

## Key Features

### Worker Portal
- Guided onboarding flow (language selection, phone login, OTP verification)
- Personal GRS score dashboard with pillar-level breakdown
- Fraud-check status indicator
- Loan/application status tracker

### Lender Portal
- Sortable applicant queue (e.g. by highest GRS score)
- Portfolio Analytics — aggregate applicant counts and score distribution
- Portfolio Risk Exposure view — total ₹ exposure, PD-weighted expected loss, % exposure in risk bands, and top flagged applicants by probability of default
- Approve / reject decision flow with an audit trail
- Approved and rejected loan history views

### Scoring Engine
- **M1 — Scorecard model:** produces the GRS (300–1000) from 5 weighted pillars (Earning 25%, Continuity 20%, Service 20%, Financial 20%, Integrity 15%)
- **M2 — Default model:** produces a probability of default (PD) using LightGBM
- **M3 — Approval model:** produces a suggested loan amount and approval recommendation
- A live demo toolbar with permanent sample profiles for quick evaluation

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS |
| **Backend** | FastAPI, SQLAlchemy (Python) |
| **Database** | SQLite |
| **Machine Learning** | Scikit-learn, XGBoost, LightGBM, SHAP, NumPy, Pandas |
| **Charts / Visualization** | Hand-rolled SVG components (no external charting library dependency) |
| **Hosting** | Render (backend) · Vercel (frontend) |

---

## Team Victus

| Name | Role |
|---|---|
| **Shreesha Kumar P** | AI/ML & Product Architecture |
| **Chethan** | Backend & API Engineering |
| **Sameeksha** | Frontend & User Experience |
| **Shraddha Shetty GR** *(Team Leader)* | Documentation, Integration & Demo Strategy |

---

## Future Scope

- Score history and trend visualization — track a worker's GRS over time rather than a single point-in-time snapshot
- Downloadable PDF assessment reports for lenders and workers
- Real-time ingestion pipeline directly from gig platform APIs, rather than batch-seeded data
- SHAP-based explainability visualizations surfaced directly in the UI (already produced by the ML pipeline internally)
- Multi-language support extended across the full worker onboarding and dashboard experience
- Production deployment with a hosted database and CI/CD pipeline
