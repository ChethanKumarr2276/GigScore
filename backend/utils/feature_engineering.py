"""Lightweight feature engineering utilities for the GigScore ML pipeline."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from ..utils.logger import get_logger

logger = get_logger(__name__)

_SCHEMA_PATH: Path = Path(__file__).resolve().parent.parent / "models" / "feature_schema.json"

_SCHEMA: dict | None = None


def _load_schema() -> dict:
    """Load and cache the feature schema from disk."""
    global _SCHEMA
    if _SCHEMA is None:
        with _SCHEMA_PATH.open("r", encoding="utf-8") as fh:
            _SCHEMA = json.load(fh)
    return _SCHEMA


def _iter_feature_defs() -> list[tuple[str, dict]]:
    """Return a flat list of (feature_name, feature_def) pairs from the schema."""
    schema = _load_schema()
    pairs: list[tuple[str, dict]] = []
    for group in schema.get("feature_groups", {}).values():
        for name, defn in group.get("features", {}).items():
            pairs.append((name, defn))
    return pairs


def build_feature_vector(raw_data: dict[str, Any]) -> dict[str, Any]:
    """Extract and coerce raw worker data into the canonical feature vector.

    Only features declared in ``feature_schema.json`` are kept.
    Missing non-nullable fields are filled with ``0`` (numeric) or ``False``
    (boolean). Missing nullable fields are kept as ``None``.

    Args:
        raw_data: Arbitrary dict of raw input values keyed by feature name.

    Returns:
        Dict containing exactly the keys defined in the schema, coerced to
        their declared types.
    """
    feature_vector: dict[str, Any] = {}

    for name, defn in _iter_feature_defs():
        raw_value = raw_data.get(name)
        dtype = defn.get("type", "float")
        nullable = defn.get("nullable", False)

        if raw_value is None:
            feature_vector[name] = None if nullable else (_default_for(dtype))
            continue

        feature_vector[name] = _coerce(raw_value, dtype)

    logger.debug("Built feature vector with %d fields.", len(feature_vector))
    return feature_vector


def validate_features(features: dict[str, Any]) -> bool:
    """Validate a feature vector against the canonical schema.

    Checks:
    * No unexpected keys.
    * Non-nullable fields are not ``None``.
    * Numeric values fall within declared ``min`` / ``max`` bounds.

    Args:
        features: Feature dict, typically produced by :func:`build_feature_vector`.

    Returns:
        ``True`` if all checks pass, ``False`` otherwise (errors are logged).
    """
    schema_defs = dict(_iter_feature_defs())
    valid = True

    for name, value in features.items():
        if name not in schema_defs:
            logger.warning("Unknown feature '%s' in vector.", name)
            valid = False
            continue

        defn = schema_defs[name]
        nullable = defn.get("nullable", False)

        if value is None:
            if not nullable:
                logger.warning("Non-nullable feature '%s' is None.", name)
                valid = False
            continue

        if isinstance(value, (int, float)) and not isinstance(value, bool):
            min_val = defn.get("min")
            max_val = defn.get("max")
            if min_val is not None and value < min_val:
                logger.warning("Feature '%s' = %s is below min %s.", name, value, min_val)
                valid = False
            if max_val is not None and value > max_val:
                logger.warning("Feature '%s' = %s is above max %s.", name, value, max_val)
                valid = False

    for name, defn in _iter_feature_defs():
        if name not in features:
            logger.warning("Expected feature '%s' is missing from vector.", name)
            valid = False

    return valid


def normalize_features(features: dict[str, Any]) -> dict[str, Any]:
    """Apply min-max normalization to bounded numeric features.

    Features with both ``min`` and ``max`` in the schema are scaled to [0, 1].
    Unbounded features, booleans, and ``None`` values are passed through unchanged.

    Args:
        features: Validated feature dict produced by :func:`build_feature_vector`.

    Returns:
        New dict with bounded numeric features normalized to [0, 1].
    """
    normalized: dict[str, Any] = {}
    schema_defs = dict(_iter_feature_defs())

    for name, value in features.items():
        defn = schema_defs.get(name, {})
        min_val = defn.get("min")
        max_val = defn.get("max")

        if (
            value is not None
            and min_val is not None
            and max_val is not None
            and not isinstance(value, bool)
            and isinstance(value, (int, float))
            and max_val > min_val
        ):
            normalized[name] = (value - min_val) / (max_val - min_val)
        else:
            normalized[name] = value

    logger.debug("Normalized %d features.", len(normalized))
    return normalized


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _default_for(dtype: str) -> Any:
    """Return a safe zero-value for a given schema type string."""
    mapping: dict[str, Any] = {"float": 0.0, "int": 0, "bool": False}
    return mapping.get(dtype, 0.0)


def _coerce(value: Any, dtype: str) -> Any:
    """Coerce a raw value to the target schema type."""
    try:
        if dtype == "float":
            return float(value)
        if dtype == "int":
            return int(float(value))
        if dtype == "bool":
            return bool(value)
    except (TypeError, ValueError):
        logger.warning("Could not coerce value %r to type '%s'.", value, dtype)
        return _default_for(dtype)
    return value
