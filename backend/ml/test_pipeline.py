from pprint import pprint
from ml.predict import generate_financial_assessment

sample_worker = {
    "monthly_income_avg": 34000,
    "monthly_income_std": 4000,
    "income_volatility": 0.12,
    "income_growth_rate": 0.08,
    "income_trend": 0.10,
    "income_per_active_day": 1200,
    "active_day_ratio": 0.88,
    "active_days_per_month": 26,
    "longest_inactive_gap": 2,
    "platform_tenure_months": 14,
    "gigs_per_week": 38,
    "multi_platform_count": 2,
    "average_rating": 4.8,
    "rating_trend": 0.02,
    "completion_rate": 0.97,
    "cancellation_rate": 0.03,
    "acceptance_rate": 0.94,
    "on_time_rate": 0.96,
    "existing_emi": 3500,
    "emi_ratio": 0.18,
    "bill_payment_ratio": 0.99,
    "cash_flow_stability": 0.85,
    "balance_volatility": 0.10,
    "average_month_end_balance": 18000,
    "penalty_events": 0,
    "chargebacks": 0,
    "fraud_indicators": False,
    "identity_verified": True,
    "document_verified": True
}

result = generate_financial_assessment(sample_worker)
pprint(result)