# GigScore — Judge Q&A Preparation Notes

> Sprint 8 | HackMatrix 24-hour IEEE CS Hackathon

---

## Q1: Account Aggregator — How does Phase 1 data acquisition work?

**Answer:**
Phase 1 uses the RBI Account Aggregator (AA) framework. Workers consent via DigiLocker to share 6–12 months of bank statement data. The AA layer delivers structured JSON transactions. We parse these to derive income, cash flow, and activity features. No raw bank credentials are ever stored — consent is revocable at any time per the AA data-sharing protocol.

---

## Q2: Bureau Integration — How do you access credit bureau data?

**Answer:**
Bureau pulls (CIBIL/Experian) require a regulated Financial Information User (FIU) licence. For this prototype we use bureau-equivalent fields (`existing_emi`) sourced from the AA debit-pattern analysis. Full bureau integration is scoped for Phase 2 after FIU onboarding with a regulated lending partner.

---

## Q3: Explainability — How do you explain a GRS to a worker or lender?

**Answer:**
M1 produces a `top_5_reasons` list of human-readable positive factors (e.g., "Stable monthly income", "No fraud indicators") ranked by signal strength. For M2/M3, SHAP TreeExplainer/LinearExplainer values are computed per prediction. If SHAP is unavailable, coefficient-based importance is used. All explanations map to the five named pillars, making every score auditable without ML expertise.

---

## Q4: OCEN Compatibility — Is GigScore OCEN-ready?

**Answer:**
The JSON output contract is designed to be OCEN-compatible. `gigtrust_id` maps to a loan-application identifier, `grs` and `default_probability` map to creditworthiness signals, and the offer fields (`max_amount`, `interest_rate`) align with OCEN loan offer objects. Full OCEN API binding is a Phase 2 integration task once a Live lending partner is onboarded.

---

## Q5: Model Validation — What data was used to train and validate the models?

**Answer:**
This is a prototype trained on representative synthetic data with realistic statistical properties (income distributions, approval rates, default rates typical of Indian gig platforms). We have not yet backtested on a real default cohort. All claimed AUC and KS metrics reflect held-out synthetic splits. Production deployment requires retraining on a lender's historical portfolio with full temporal validation.

---

## Q6: Bias Mitigation — How do you prevent discriminatory scoring?

**Answer:**
The feature schema explicitly excludes protected attributes — gender, caste, religion, and geographic region are not features. The five pillars score only observable financial behaviour and verified identity. A human underwriter remains the final decision-maker; the GRS is an advisory signal. We plan a fairness audit across income bands before any live deployment.

---

## Q7: Limitations — What are the known limitations of this prototype?

**Answer:**
Three key limitations: (1) No large-scale default backtesting — models were trained on synthetic data and require validation on real historical portfolios before production. (2) Service quality features (ratings, completion rates) require direct platform API partnerships not yet established. (3) Income-linked repayment scheduling is a design concept in the UI; actual EMI structuring requires RBI-licensed NBFC or bank partnership.

---

## Quick Reference Card

| Question Type | Key Answer |
|---|---|
| Data source | RBI AA framework + bank statements; no raw credentials |
| Bureau | Planned Phase 2; FIU licence required |
| Explainability | SHAP + human-readable pillar reasons |
| Interoperability | OCEN-compatible JSON contract |
| Validation | Synthetic prototype; real-data retraining needed |
| Bias | No protected attributes; human underwriter final decision |
| Limitations | No backtesting, no platform APIs, income repayment is concept |
