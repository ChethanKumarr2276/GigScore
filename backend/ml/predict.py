"""Sprint 7 — Unified Prediction Orchestrator for the GigScore ML pipeline.

Single entry point consumed by the FastAPI backend.
Orchestrates: Feature Engineering → M1 → M2 → M3 → Explainability →
Amount Estimation → Interest Estimation → Final Assessment.
"""

from __future__ import annotations

import random
import string
import time
from typing import Any

from .config import RANDOM_SEED
from .m1_scorecard import FinancialStabilityAssessment
from .utils.feature_engineering import build_feature_vector, validate_features
from .utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Band → interest rate base range  (min%, max%)
# ---------------------------------------------------------------------------
_BAND_RATE_RANGE: dict[str, tuple[float, float]] = {
    "PRIME":    (11.0, 13.0),
    "STRONG":   (13.0, 15.0),
    "RELIABLE": (15.0, 18.0),
    "EMERGING": (18.0, 24.0),
    "BUILDING": (24.0, 30.0),
}

# GRS scaling boundaries for interest rate linear interpolation
_GRS_MIN, _GRS_MAX = 300, 1000

# Loan amount caps (INR)
_AMOUNT_MIN: int = 5_000
_AMOUNT_MAX: int = 2_00_000

# Coaching actions keyed by the weakest pillar
_COACHING_POOL: dict[str, list[str]] = {
    "earning":    [
        "Diversify income sources across multiple platforms",
        "Target peak-demand hours to raise daily earnings",
        "Reduce income gaps by maintaining consistent bookings",
    ],
    "continuity": [
        "Maintain active working days above 20 per month",
        "Avoid inactive streaks longer than 7 days",
        "Build tenure by staying active on existing platforms",
    ],
    "service":    [
        "Maintain ratings above 4.5 to strengthen service score",
        "Reduce cancellation rate below 5%",
        "Improve on-time delivery to raise completion score",
    ],
    "financial":  [
        "Keep EMI burden below 30% of monthly income",
        "Pay utility bills before the due date every month",
        "Build a month-end savings buffer of at least 0.5× income",
    ],
    "integrity":  [
        "Complete identity and document verification immediately",
        "Avoid disputed transactions to clear fraud indicators",
        "Dispute any incorrect platform penalty records",
    ],
}

_rng = random.Random(RANDOM_SEED)


# ---------------------------------------------------------------------------
# GigTrust ID generator
# ---------------------------------------------------------------------------

def _generate_gigtrust_id() -> str:
    """Generate a deterministic-prefix, time-suffixed GigTrust ID.

    Format: ``GT-<3-char state>-<4-digit year>-<5-char alphanum>``

    Example: ``GT-MHF-2026-YNKMX``

    Returns:
        Unique string ID.
    """
    state_codes = ["MHF", "DLI", "KAR", "TNG", "GJR", "RAJ", "PNJ", "BNL"]
    state = _rng.choice(state_codes)
    year = time.strftime("%Y")
    suffix_chars = string.ascii_uppercase + string.digits
    suffix = "".join(_rng.choices(suffix_chars, k=5))
    return f"GT-{state}-{year}-{suffix}"


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class PredictionOrchestrator:
    """Orchestrates the full GigScore prediction pipeline.

    Combines M1 (Financial Stability), M2 (Probability of Default),
    M3 (Approval Probability), explainability, and loan estimation
    into a single unified response.

    Usage::

        orchestrator = PredictionOrchestrator()
        result = orchestrator.generate_final_assessment(raw_worker_data)
    """

    def __init__(self) -> None:
        self._m1 = FinancialStabilityAssessment()

    # ------------------------------------------------------------------
    # Step 1: Feature Engineering
    # ------------------------------------------------------------------

    def build_features(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Build and validate the canonical feature vector from raw worker data.

        Args:
            raw_data: Arbitrary dict of raw input values.

        Returns:
            Validated feature dict conforming to ``feature_schema.json``.
        """
        features = build_feature_vector(raw_data)
        if not validate_features(features):
            logger.warning("Feature vector has validation warnings — proceeding.")
        return features

    # ------------------------------------------------------------------
    # Step 2: M1 Financial Stability Assessment
    # ------------------------------------------------------------------

    def run_m1(self, features: dict[str, Any]) -> dict[str, Any]:
        """Run the M1 deterministic scorecard.

        Args:
            features: Canonical feature vector.

        Returns:
            M1 assessment dict (GRS, band, pillar scores, top-5 reasons).
        """
        return self._m1.generate_assessment(features)

    # ------------------------------------------------------------------
    # Step 3: M2 Probability of Default
    # ------------------------------------------------------------------

    def run_m2(self, features: dict[str, Any]) -> float | None:
        """Run the M2 default probability model.

        Returns ``None`` gracefully if the model artefact is missing.

        Args:
            features: Canonical feature vector.

        Returns:
            Probability of default in [0, 1], or ``None``.
        """
        try:
            from .m2_default_model import predict_default_probability
            return predict_default_probability(features)
        except FileNotFoundError:
            logger.warning("M2 model artefact not found — default_probability set to None.")
            return None
        except KeyError as exc:
            logger.warning("M2 missing features (%s) — default_probability set to None.", exc)
            return None
        except Exception as exc:
            logger.error("M2 unexpected error: %s — default_probability set to None.", exc)
            return None

    # ------------------------------------------------------------------
    # Step 4: M3 Approval Probability
    # ------------------------------------------------------------------

    def run_m3(self, features: dict[str, Any]) -> float | None:
        """Run the M3 approval probability model.

        Returns ``None`` gracefully if the model artefact is missing.

        Args:
            features: Canonical feature vector.

        Returns:
            Probability of approval in [0, 1], or ``None``.
        """
        try:
            from .m3_approval_model import predict_approval_probability
            return predict_approval_probability(features)
        except FileNotFoundError:
            logger.warning("M3 model artefact not found — approval_probability set to None.")
            return None
        except KeyError as exc:
            logger.warning("M3 missing features (%s) — approval_probability set to None.", exc)
            return None
        except Exception as exc:
            logger.error("M3 unexpected error: %s — approval_probability set to None.", exc)
            return None

    # ------------------------------------------------------------------
    # Step 5: Amount Estimation
    # ------------------------------------------------------------------

    def estimate_max_amount(
        self,
        features: dict[str, Any],
        grs: int,
        p_approve: float | None,
    ) -> int:
        """Estimate the maximum indicative loan amount for the worker.

        Formula::

            base_amount    = 30% × annual_income
            grs_factor     = (GRS - 300) / 700            → [0, 1]
            approve_factor = p_approve if available, else 0.5
            eq_factor      = {High: 1.0, Medium: 0.75, Low: 0.5}

            max_amount = base_amount × (0.4 + 0.4×grs_factor + 0.2×approve_factor)
                       × eq_factor

        Clamped to [₹5,000, ₹2,00,000].

        Args:
            features: Canonical feature vector.
            grs: GRS integer in [300, 1000].
            p_approve: M3 approval probability, or ``None``.

        Returns:
            Estimated maximum loan amount in INR (integer).
        """
        income_avg = float(features.get("monthly_income_avg") or 0.0)
        annual_income = income_avg * 12
        base = annual_income * 0.30

        grs_factor = (grs - 300) / 700.0
        approve_factor = float(p_approve) if p_approve is not None else 0.5

        eq = features.get("evidence_quality_label", "Medium")  # injected after M1
        eq_factor = {"High": 1.0, "Medium": 0.75, "Low": 0.5}.get(str(eq), 0.75)

        amount = base * (0.40 + 0.40 * grs_factor + 0.20 * approve_factor) * eq_factor
        clamped = int(max(_AMOUNT_MIN, min(_AMOUNT_MAX, round(amount / 100) * 100)))
        logger.debug("estimate_max_amount: base=%.0f → clamped=%d", base, clamped)
        return clamped

    # ------------------------------------------------------------------
    # Step 6: Interest Rate Estimation
    # ------------------------------------------------------------------

    def estimate_interest_rate(self, grs: int, pd: float | None) -> float:
        """Estimate the indicative annual interest rate.

        Starts from the band's midpoint rate, interpolated by GRS position
        within the band, then adjusted upward if PD is elevated.

        PD adjustment: +0.5% per 10-point PD above 0.20 (capped at +3%).

        Args:
            grs: GRS integer in [300, 1000].
            pd: Probability of default in [0, 1], or ``None``.

        Returns:
            Indicative interest rate rounded to 1 decimal place.
        """
        # Determine band and range
        if grs >= 900:
            band, lo, hi = "PRIME",    11.0, 13.0
        elif grs >= 800:
            band, lo, hi = "STRONG",   13.0, 15.0
        elif grs >= 650:
            band, lo, hi = "RELIABLE", 15.0, 18.0
        elif grs >= 500:
            band, lo, hi = "EMERGING", 18.0, 24.0
        else:
            band, lo, hi = "BUILDING", 24.0, 30.0

        # Linear interpolation within band: higher GRS → lower rate
        band_bounds = {"PRIME": (900, 1000), "STRONG": (800, 900),
                       "RELIABLE": (650, 800), "EMERGING": (500, 650),
                       "BUILDING": (300, 500)}
        b_lo, b_hi = band_bounds[band]
        t = (grs - b_lo) / (b_hi - b_lo)   # 0 at bottom of band, 1 at top
        rate = hi - t * (hi - lo)           # higher GRS → lower rate

        # PD upward adjustment
        if pd is not None and pd > 0.20:
            pd_excess = pd - 0.20
            pd_premium = min(pd_excess * 5.0, 3.0)   # +0.5% per 10pt, cap 3%
            rate += pd_premium
            logger.debug("PD premium +%.2f%% (pd=%.3f).", pd_premium, pd)

        rate = max(11.0, min(30.0, rate))
        return round(rate, 1)

    # ------------------------------------------------------------------
    # Step 7: Narrative generation
    # ------------------------------------------------------------------

    @staticmethod
    def _worker_summary(m1: dict[str, Any], pd: float | None) -> str:
        """One-sentence summary for the worker-facing view."""
        band = m1["grs_band"]
        eq   = m1["evidence_quality"]
        grs  = m1["grs"]
        pd_str = f"{pd:.0%}" if pd is not None else "unknown"
        return (
            f"Your GigScore of {grs} ({band}) reflects {m1['financial_assessment'].lower()} "
            f"financial stability with {eq.lower()} evidence quality. "
            f"Estimated repayment risk: {pd_str}."
        )

    @staticmethod
    def _lender_summary(
        m1: dict[str, Any],
        pd: float | None,
        p_approve: float | None,
        max_amount: int,
        rate: float,
    ) -> str:
        """Two-sentence summary for the lender dashboard."""
        grs    = m1["grs"]
        band   = m1["grs_band"]
        eq     = m1["evidence_quality"]
        pd_str = f"{pd:.1%}" if pd is not None else "N/A"
        pa_str = f"{p_approve:.1%}" if p_approve is not None else "N/A"
        return (
            f"Worker GRS: {grs} ({band}) | Evidence quality: {eq} | "
            f"PD: {pd_str} | P(Approve): {pa_str}. "
            f"Indicative offer: up to ₹{max_amount:,} at {rate}% p.a."
        )

    @staticmethod
    def _coaching_actions(m1: dict[str, Any]) -> list[str]:
        """Return three targeted coaching actions for the weakest pillars."""
        pillar_scores: dict[str, float] = m1.get("pillar_scores", {})
        sorted_pillars = sorted(pillar_scores.items(), key=lambda x: x[1])
        actions: list[str] = []
        for pillar, _ in sorted_pillars[:2]:
            pool = _COACHING_POOL.get(pillar, [])
            if pool:
                actions.append(pool[0])
        # Always add the top universal tip
        actions.append("Maintain active working days above 20 per month")
        return actions[:3]

    # ------------------------------------------------------------------
    # Final orchestration
    # ------------------------------------------------------------------

    def generate_final_assessment(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Run the complete GigScore pipeline and return the unified response.

        Args:
            raw_data: Dict of raw worker features. Must include keys matching
                ``feature_schema.json``. ``worker_id`` is optional.

        Returns:
            Unified assessment dict conforming to the GigScore JSON contract.
        """
        worker_id = raw_data.get("worker_id")
        logger.info("=== GigScore Pipeline START | worker_id=%s ===", worker_id)

        # Step 1 — Feature engineering
        features = self.build_features(raw_data)

        # Step 2 — M1
        m1 = self.run_m1(features)
        grs  = m1["grs"]
        band = m1["grs_band"]
        eq   = m1["evidence_quality"]
        # Inject eq label so estimate_max_amount can use it
        features["evidence_quality_label"] = eq

        # Step 3 — M2
        pd_score = self.run_m2(features)

        # Step 4 — M3
        p_approve = self.run_m3(features)

        # Step 5 — Amount & rate estimation
        max_amount = self.estimate_max_amount(features, grs, p_approve)
        rate       = self.estimate_interest_rate(grs, pd_score)

        # Step 6 — Fraud flag
        fraud_flag = bool(features.get("fraud_indicators", 0))

        # Step 7 — Narratives & coaching
        worker_summary = self._worker_summary(m1, pd_score)
        lender_summary = self._lender_summary(m1, pd_score, p_approve, max_amount, rate)
        coaching       = self._coaching_actions(m1)

        # Step 8 — GigTrust ID
        gigtrust_id = _generate_gigtrust_id()

        result: dict[str, Any] = {
            "gigtrust_id":         gigtrust_id,
            "grs":                 grs,
            "grs_band":            band,
            "financial_assessment": m1["financial_assessment"],
            "default_probability": round(pd_score, 4) if pd_score is not None else None,
            "approval_probability": round(p_approve, 4) if p_approve is not None else None,
            "max_amount":          max_amount,
            "interest_rate":       rate,
            "evidence_quality":    eq,
            "top_5_reasons":       m1["top_5_reasons"],
            "worker_summary":      worker_summary,
            "lender_summary":      lender_summary,
            "coaching_actions":    coaching,
            "fraud_flag":          fraud_flag,
            "pillar_scores":       m1["pillar_scores"],
            "model_version":       "2.0.0-sprint7",
        }

        logger.info(
            "=== GigScore Pipeline COMPLETE | worker_id=%s | GRS=%d | "
            "band=%s | amount=%d | rate=%.1f%% ===",
            worker_id, grs, band, max_amount, rate,
        )
        return result


# ---------------------------------------------------------------------------
# Module-level singleton & public API
# ---------------------------------------------------------------------------

_orchestrator = PredictionOrchestrator()


def generate_financial_assessment(raw_data: dict[str, Any]) -> dict[str, Any]:
    """Single entry point for the FastAPI backend.

    Runs the complete GigScore pipeline (M1 → M2 → M3 → estimation)
    and returns a unified JSON-serialisable assessment dict.

    Args:
        raw_data: Dict of raw worker features. Keys must match
            ``ml/models/feature_schema.json``.

    Returns:
        Unified assessment dict. See ``docs/prediction_pipeline.md``
        for the full JSON contract.

    Example::

        from ml.predict import generate_financial_assessment

        result = generate_financial_assessment({
            "worker_id": "W001",
            "monthly_income_avg": 38000,
            "income_volatility": 0.12,
            ...
        })
    """
    return _orchestrator.generate_final_assessment(raw_data)


# ---------------------------------------------------------------------------
# Backward-compatible alias (Sprint 3 callers used generate_assessment)
# ---------------------------------------------------------------------------

def generate_assessment(worker_features: dict[str, Any]) -> dict[str, Any]:
    """Backward-compatible wrapper for Sprint 3 callers.

    Delegates to :func:`generate_financial_assessment`.

    Args:
        worker_features: Raw worker feature dict.

    Returns:
        Unified assessment dict.
    """
    return generate_financial_assessment(worker_features)
