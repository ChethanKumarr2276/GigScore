"""Explainability helpers for GigScore predictions.

Sprint 6 baseline: coefficient-based and pillar-based explanations.
SHAP integration is available when the ``shap`` package is installed.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from .utils.logger import get_logger

logger = get_logger(__name__)


def get_feature_importance(model: Any, feature_names: list[str] | None = None) -> dict[str, float]:
    """Extract global feature importances from a fitted model.

    Supports:
    * sklearn Logistic Regression (``coef_``)
    * sklearn Pipeline wrapping a classifier
    * XGBoost / LightGBM / Random Forest (``feature_importances_``)

    Args:
        model: Fitted model or sklearn Pipeline.
        feature_names: Ordered list of feature names. Required for tree models.

    Returns:
        Dict mapping feature names to normalised importance scores in [0, 1].
        Returns an empty dict if importances cannot be extracted.
    """
    clf = model
    # Unwrap sklearn Pipeline
    if hasattr(model, "named_steps"):
        clf = model.named_steps.get("classifier", model[-1])

    importances: np.ndarray | None = None

    if hasattr(clf, "coef_"):
        raw = np.abs(clf.coef_).mean(axis=0)
        importances = raw
    elif hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
    else:
        logger.warning("Cannot extract feature importances from %s.", type(clf).__name__)
        return {}

    total = importances.sum()
    if total == 0:
        return {}

    normed = importances / total
    names = feature_names or [f"feature_{i}" for i in range(len(normed))]
    result = {name: round(float(score), 6) for name, score in zip(names, normed)}
    return dict(sorted(result.items(), key=lambda x: -x[1]))


def get_top_reasons(
    shap_values: np.ndarray,
    feature_names: list[str],
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """Return the top-N SHAP contributors for a single prediction.

    Args:
        shap_values: 1-D array of SHAP values for one sample.
        feature_names: Ordered list of feature names matching ``shap_values``.
        top_n: Number of top contributors to return.

    Returns:
        List of dicts with keys ``feature``, ``shap_value``, and ``direction``
        (``"positive"`` or ``"negative"``), sorted by absolute SHAP value descending.
    """
    if len(shap_values) != len(feature_names):
        raise ValueError("shap_values and feature_names must have the same length.")

    indexed = sorted(
        enumerate(shap_values), key=lambda x: abs(x[1]), reverse=True
    )[:top_n]

    return [
        {
            "feature":    feature_names[i],
            "shap_value": round(float(v), 6),
            "direction":  "positive" if v >= 0 else "negative",
        }
        for i, v in indexed
    ]


def explain_prediction(
    model: Any,
    features: dict[str, Any],
    feature_names: list[str] | None = None,
) -> dict[str, Any]:
    """Generate a feature-importance explanation for a single prediction.

    Uses SHAP TreeExplainer when available; falls back to coefficient-based
    importance so the pipeline never crashes on missing SHAP.

    Args:
        model: Fitted model or sklearn Pipeline.
        features: Validated feature dict for one worker.
        feature_names: Ordered list of feature names. Inferred from *features*
            when not supplied.

    Returns:
        Dict with keys:

        * ``"feature_importances"``: global importance scores
        * ``"top_reasons"``: list of top contributing features (SHAP-based if available)
        * ``"shap_available"``: bool indicating whether SHAP was used
    """
    names = feature_names or list(features.keys())
    importances = get_feature_importance(model, names)

    # Attempt SHAP — silently fall back if unavailable
    shap_available = False
    top_reasons: list[dict[str, Any]] = []

    try:
        import shap  # type: ignore

        clf = model
        if hasattr(model, "named_steps"):
            clf = model.named_steps.get("classifier", model[-1])

        row_values = np.array([[features[n] for n in names]], dtype=float)

        try:
            explainer = shap.TreeExplainer(clf)
            sv = explainer.shap_values(row_values)
            vals = sv[1][0] if isinstance(sv, list) else sv[0]
        except Exception:
            explainer = shap.LinearExplainer(clf, row_values)
            sv = explainer.shap_values(row_values)
            vals = sv[0] if hasattr(sv, "__len__") else sv

        top_reasons = get_top_reasons(np.array(vals), names)
        shap_available = True
    except Exception as exc:
        logger.debug("SHAP unavailable (%s); using importance-based fallback.", exc)
        # Fallback: rank by coefficient importance
        top_reasons = [
            {"feature": k, "shap_value": None, "direction": "positive"}
            for k in list(importances.keys())[:5]
        ]

    return {
        "feature_importances": importances,
        "top_reasons":         top_reasons,
        "shap_available":      shap_available,
    }
