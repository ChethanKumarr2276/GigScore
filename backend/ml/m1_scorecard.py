"""M1 — Financial Stability Assessment Engine.

Deterministic, weighted five-pillar scoring system.
No ML training. No randomness. Fully reproducible.
"""

from __future__ import annotations

import math
from typing import Any

from .utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Pillar weights (must sum to 1.0)
# ---------------------------------------------------------------------------
_WEIGHTS: dict[str, float] = {
    "earning":    0.25,
    "continuity": 0.20,
    "service":    0.20,
    "financial":  0.20,
    "integrity":  0.15,
}

# ---------------------------------------------------------------------------
# GRS band thresholds
# ---------------------------------------------------------------------------
_BANDS: list[tuple[int, str]] = [
    (900, "PRIME"),
    (800, "STRONG"),
    (650, "RELIABLE"),
    (500, "EMERGING"),
    (300, "BUILDING"),
]

_BAND_TO_LABEL: dict[str, str] = {
    "PRIME":    "Exceptional",
    "STRONG":   "Very High",
    "RELIABLE": "High",
    "EMERGING": "Moderate",
    "BUILDING": "Low",
}

# ---------------------------------------------------------------------------
# Hard risk cap rules: (feature, test, max_grs)
# ---------------------------------------------------------------------------
_HARD_CAPS: list[tuple[str, Any, int]] = [
    ("fraud_indicators",       lambda v: isinstance(v, (int, float)) and v > 0, 450),
    ("identity_verified",      lambda v: v is False or v == 0,                  550),
    ("platform_tenure_months", lambda v: isinstance(v, (int, float)) and v < 1, 650),
]


def _safe_float(value: Any, default: float = 0.0) -> float:
    """Coerce *value* to float, returning *default* on failure or None."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* to [lo, hi]."""
    return max(lo, min(hi, value))


class FinancialStabilityAssessment:
    """Deterministic five-pillar GigScore financial stability engine (M1).

    Usage::

        engine = FinancialStabilityAssessment()
        result = engine.generate_assessment(feature_dict)
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate_pillars(self, features: dict[str, Any]) -> dict[str, float]:
        """Compute normalised [0, 1] scores for all five pillars.

        Args:
            features: Validated feature dict matching ``feature_schema.json``.

        Returns:
            Dict with keys ``earning``, ``continuity``, ``service``,
            ``financial``, ``integrity``, each in [0, 1].
        """
        return {
            "earning":    self._pillar_earning(features),
            "continuity": self._pillar_continuity(features),
            "service":    self._pillar_service(features),
            "financial":  self._pillar_financial(features),
            "integrity":  self._pillar_integrity(features),
        }

    def calculate_grs(self, features: dict[str, Any]) -> int:
        """Compute the Gig Reliability Score (GRS) on a 300–1000 scale.

        Formula::

            raw = Σ weight_i * pillar_i
            GRS = round(300 + 700 * (raw ** 0.85))

        Hard caps are applied after the formula.

        Args:
            features: Validated feature dict matching ``feature_schema.json``.

        Returns:
            Integer GRS clamped to [300, 1000].
        """
        pillars = self.calculate_pillars(features)
        raw = sum(_WEIGHTS[k] * v for k, v in pillars.items())
        grs = round(300 + 700 * (raw ** 0.85))
        grs = int(_clamp(grs, 300, 1000))

        # Apply hard risk caps
        for feat, test, cap in _HARD_CAPS:
            val = features.get(feat)
            if test(val):
                grs = min(grs, cap)
                logger.debug("Hard cap applied: %s capped GRS to %d.", feat, cap)

        return grs

    def calculate_evidence_quality(self, features: dict[str, Any]) -> str:
        """Determine evidence quality tier based on data completeness.

        Rules:
        - ``High``:   tenure >= 12 months AND multi_platform >= 2
                      AND identity_verified AND document_verified
        - ``Medium``: tenure >= 6 months OR identity_verified
        - ``Low``:    otherwise

        Args:
            features: Validated feature dict matching ``feature_schema.json``.

        Returns:
            One of ``"High"``, ``"Medium"``, or ``"Low"``.
        """
        tenure    = _safe_float(features.get("platform_tenure_months"), 0.0)
        platforms = int(_safe_float(features.get("multi_platform_count"), 1.0))
        id_ok     = bool(features.get("identity_verified", False))
        doc_ok    = bool(features.get("document_verified", False))

        if tenure >= 12 and platforms >= 2 and id_ok and doc_ok:
            return "High"
        if tenure >= 6 or id_ok:
            return "Medium"
        return "Low"

    def calculate_band(self, grs: int) -> str:
        """Map a GRS integer to its assessment band label.

        Args:
            grs: Integer score in [300, 1000].

        Returns:
            One of ``BUILDING``, ``EMERGING``, ``RELIABLE``,
            ``STRONG``, ``PRIME``.
        """
        for threshold, band in _BANDS:
            if grs >= threshold:
                return band
        return "BUILDING"

    def generate_assessment(self, features: dict[str, Any]) -> dict[str, Any]:
        """Produce the full M1 assessment payload for a single gig worker.

        Args:
            features: Validated feature dict matching ``feature_schema.json``.

        Returns:
            Assessment dict conforming to the M1 output contract.
        """
        pillars  = self.calculate_pillars(features)
        grs      = self.calculate_grs(features)
        band     = self.calculate_band(grs)
        eq       = self.calculate_evidence_quality(features)
        reasons  = self._top_reasons(features, pillars)

        return {
            "grs":                   grs,
            "grs_band":              band,
            "financial_assessment":  _BAND_TO_LABEL[band],
            "evidence_quality":      eq,
            "pillar_scores": {k: round(v, 4) for k, v in pillars.items()},
            "top_5_reasons":         reasons,
        }

    # ------------------------------------------------------------------
    # Pillar implementations
    # ------------------------------------------------------------------

    def _pillar_earning(self, f: dict[str, Any]) -> float:
        """Earning Power & Stability pillar (weight 0.25)."""
        income_avg    = _safe_float(f.get("monthly_income_avg"), 0.0)
        volatility    = _safe_float(f.get("income_volatility"), 1.0)
        growth_rate   = _safe_float(f.get("income_growth_rate"), 0.0)
        income_trend  = _safe_float(f.get("income_trend"), 0.0)
        per_active    = _safe_float(f.get("income_per_active_day"), 0.0)

        # Income adequacy: sigmoid centred at 20,000 INR/month
        income_score = 1.0 / (1.0 + math.exp(-((income_avg - 20_000) / 10_000)))

        # Volatility: lower is better; penalise coefficient of variation > 0.5
        volatility_score = _clamp(1.0 - (volatility / 0.5), 0.0, 1.0)

        # Growth: positive growth up to +50% gets full credit
        growth_score = _clamp((growth_rate + 0.1) / 0.6, 0.0, 1.0)

        # Trend: positive slope gets a bonus, capped
        trend_score = _clamp(0.5 + income_trend / 5_000, 0.0, 1.0)

        # Per-active-day income adequacy: sigmoid centred at 1,500 INR
        pad_score = 1.0 / (1.0 + math.exp(-((per_active - 1_500) / 800)))

        score = (
            0.35 * income_score +
            0.30 * volatility_score +
            0.15 * growth_score +
            0.10 * trend_score +
            0.10 * pad_score
        )
        return round(_clamp(score, 0.0, 1.0), 6)

    def _pillar_continuity(self, f: dict[str, Any]) -> float:
        """Work Volume & Continuity pillar (weight 0.20)."""
        active_ratio   = _safe_float(f.get("active_day_ratio"), 0.0)
        active_days_pm = _safe_float(f.get("active_days_per_month"), 0.0)
        inactive_gap   = _safe_float(f.get("longest_inactive_gap"), 90.0)
        tenure_months  = _safe_float(f.get("platform_tenure_months"), 0.0)
        gigs_pw        = _safe_float(f.get("gigs_per_week"), 0.0)

        # Active day ratio: direct normalised value
        ratio_score = _clamp(active_ratio, 0.0, 1.0)

        # Active days per month: full credit at >= 20 days
        days_pm_score = _clamp(active_days_pm / 20.0, 0.0, 1.0)

        # Inactive gap: penalty for gaps > 7 days; worst = 30+ days
        gap_score = _clamp(1.0 - ((inactive_gap - 7) / 23.0), 0.0, 1.0)

        # Tenure: full credit at >= 24 months
        tenure_score = _clamp(tenure_months / 24.0, 0.0, 1.0)

        # Gigs per week: full credit at >= 5 gigs/week
        gigs_score = _clamp(gigs_pw / 5.0, 0.0, 1.0)

        score = (
            0.25 * ratio_score +
            0.20 * days_pm_score +
            0.20 * gap_score +
            0.20 * tenure_score +
            0.15 * gigs_score
        )
        return round(_clamp(score, 0.0, 1.0), 6)

    def _pillar_service(self, f: dict[str, Any]) -> float:
        """Service Quality pillar (weight 0.20)."""
        avg_rating   = _safe_float(f.get("average_rating"), 3.0)
        rating_trend = _safe_float(f.get("rating_trend"), 0.0)
        completion   = _safe_float(f.get("completion_rate"), 0.5)
        cancellation = _safe_float(f.get("cancellation_rate"), 0.5)
        acceptance   = _safe_float(f.get("acceptance_rate"), 0.5)
        on_time      = _safe_float(f.get("on_time_rate"), 0.5)

        # Rating: 1-5 → 0-1
        rating_score = _clamp((avg_rating - 1.0) / 4.0, 0.0, 1.0)

        # Rating trend: positive trend up to +0.5/month gets full bonus
        trend_score = _clamp(0.5 + rating_trend / 0.5, 0.0, 1.0)

        # Completion / on-time / acceptance: direct [0,1]
        completion_score = _clamp(completion, 0.0, 1.0)
        cancel_score     = _clamp(1.0 - cancellation, 0.0, 1.0)
        acceptance_score = _clamp(acceptance, 0.0, 1.0)
        on_time_score    = _clamp(on_time, 0.0, 1.0)

        score = (
            0.30 * rating_score +
            0.10 * trend_score +
            0.25 * completion_score +
            0.15 * cancel_score +
            0.10 * acceptance_score +
            0.10 * on_time_score
        )
        return round(_clamp(score, 0.0, 1.0), 6)

    def _pillar_financial(self, f: dict[str, Any]) -> float:
        """Financial Health & Debt Burden pillar (weight 0.20)."""
        income_avg   = _safe_float(f.get("monthly_income_avg"), 1.0)  # avoid div/0
        emi_ratio    = _safe_float(f.get("emi_ratio"), 1.0)
        bill_ratio   = _safe_float(f.get("bill_payment_ratio"), 0.0)
        cash_flow    = _safe_float(f.get("cash_flow_stability"), 0.0)
        bal_vol      = _safe_float(f.get("balance_volatility"), 0.0)
        month_end    = _safe_float(f.get("average_month_end_balance"), 0.0)

        # EMI ratio: full credit below 0.3; zero credit above 0.7
        emi_score = _clamp(1.0 - (emi_ratio / 0.7), 0.0, 1.0)

        # Bill payment: direct ratio
        bill_score = _clamp(bill_ratio, 0.0, 1.0)

        # Cash flow stability: direct ratio
        cash_score = _clamp(cash_flow, 0.0, 1.0)

        # Balance volatility: penalise std > 0.5× monthly income
        norm_vol = bal_vol / max(income_avg, 1.0)
        bal_vol_score = _clamp(1.0 - (norm_vol / 0.5), 0.0, 1.0)

        # Month-end balance: positive balance gets full credit at >= 0.5× income
        norm_bal = month_end / max(income_avg, 1.0)
        bal_score = _clamp(norm_bal / 0.5, 0.0, 1.0)

        score = (
            0.30 * emi_score +
            0.25 * bill_score +
            0.20 * cash_score +
            0.15 * bal_vol_score +
            0.10 * bal_score
        )
        return round(_clamp(score, 0.0, 1.0), 6)

    def _pillar_integrity(self, f: dict[str, Any]) -> float:
        """Integrity & Verification pillar (weight 0.15)."""
        penalty_events = _safe_float(f.get("penalty_events"), 0.0)
        chargebacks    = _safe_float(f.get("chargebacks"), 0.0)
        fraud          = _safe_float(f.get("fraud_indicators"), 0.0)
        id_verified    = 1.0 if f.get("identity_verified") else 0.0
        doc_verified   = 1.0 if f.get("document_verified") else 0.0

        # Risk events: each penalty/chargeback/fraud costs points
        penalty_score  = _clamp(1.0 - (penalty_events / 3.0), 0.0, 1.0)
        chargeback_score = _clamp(1.0 - (chargebacks / 3.0), 0.0, 1.0)
        fraud_score    = 0.0 if fraud > 0 else 1.0

        score = (
            0.25 * penalty_score +
            0.25 * chargeback_score +
            0.25 * fraud_score +
            0.15 * id_verified +
            0.10 * doc_verified
        )
        return round(_clamp(score, 0.0, 1.0), 6)

    # ------------------------------------------------------------------
    # Reason generation
    # ------------------------------------------------------------------

    def _top_reasons(
        self,
        features: dict[str, Any],
        pillars: dict[str, float],
    ) -> list[str]:
        """Select the top-5 human-readable positive reasons for the GRS.

        Each candidate reason is scored so that the strongest applicable
        factors surface first.

        Args:
            features: Validated feature dict.
            pillars: Pillar scores produced by :meth:`calculate_pillars`.

        Returns:
            List of up to 5 reason strings.
        """
        candidates: list[tuple[float, str]] = []

        income_avg   = _safe_float(features.get("monthly_income_avg"), 0.0)
        volatility   = _safe_float(features.get("income_volatility"), 1.0)
        active_ratio = _safe_float(features.get("active_day_ratio"), 0.0)
        tenure       = _safe_float(features.get("platform_tenure_months"), 0.0)
        rating       = _safe_float(features.get("average_rating"), 0.0)
        completion   = _safe_float(features.get("completion_rate"), 0.0)
        emi_ratio    = _safe_float(features.get("emi_ratio"), 1.0)
        bill_ratio   = _safe_float(features.get("bill_payment_ratio"), 0.0)
        cash_flow    = _safe_float(features.get("cash_flow_stability"), 0.0)
        id_ok        = bool(features.get("identity_verified", False))
        doc_ok       = bool(features.get("document_verified", False))
        fraud        = _safe_float(features.get("fraud_indicators"), 0.0)

        if income_avg >= 20_000:
            candidates.append((income_avg / 50_000, "Stable monthly income"))
        if volatility <= 0.25:
            candidates.append((1.0 - volatility, "Low income volatility"))
        if active_ratio >= 0.6:
            candidates.append((active_ratio, "Consistent work activity"))
        if tenure >= 12:
            candidates.append((min(tenure / 24.0, 1.0), "Long platform tenure"))
        if rating >= 4.0:
            candidates.append(((rating - 1.0) / 4.0, "Strong customer ratings"))
        if completion >= 0.90:
            candidates.append((completion, "High completion rate"))
        if emi_ratio <= 0.30:
            candidates.append((1.0 - emi_ratio, "Low existing debt burden"))
        if bill_ratio >= 0.85:
            candidates.append((bill_ratio, "Timely bill payments"))
        if cash_flow >= 0.75:
            candidates.append((cash_flow, "Strong cash flow stability"))
        if id_ok and doc_ok:
            candidates.append((1.0, "Verified identity and documents"))
        if fraud == 0:
            candidates.append((1.0, "No fraud indicators"))

        candidates.sort(key=lambda x: x[0], reverse=True)
        # Deduplicate labels while preserving order
        seen: set[str] = set()
        reasons: list[str] = []
        for _, label in candidates:
            if label not in seen:
                seen.add(label)
                reasons.append(label)
            if len(reasons) == 5:
                break

        return reasons
