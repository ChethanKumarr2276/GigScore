"""Sprint 8 — Integration validation script for the GigScore ML pipeline.

Usage (from E:\\gigworker):
    python ml/integration/integration_check.py

Exit code 0 = PASS | Exit code 1 = FAIL
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Ensure the project root is on sys.path so the ml package resolves
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from ml.predict import generate_financial_assessment  # noqa: E402


_SAMPLE_INPUT_PATH = Path(__file__).parent / "sample_input.json"

_REQUIRED_FIELDS = [
    "gigtrust_id",
    "grs",
    "grs_band",
    "financial_assessment",
    "default_probability",
    "approval_probability",
    "max_amount",
    "interest_rate",
    "evidence_quality",
    "top_5_reasons",
    "worker_summary",
    "lender_summary",
    "coaching_actions",
    "fraud_flag",
    "pillar_scores",
    "model_version",
]

_VALID_BANDS = {"BUILDING", "EMERGING", "RELIABLE", "STRONG", "PRIME"}
_VALID_EQ    = {"High", "Medium", "Low"}


def _check(condition: bool, label: str, errors: list[str]) -> None:
    if not condition:
        errors.append(label)


def validate_response(result: dict) -> list[str]:
    """Validate all required fields and value ranges in the assessment response.

    Args:
        result: Dict returned by ``generate_financial_assessment()``.

    Returns:
        List of error strings. Empty list means all checks passed.
    """
    errors: list[str] = []

    # Required field presence
    for field in _REQUIRED_FIELDS:
        _check(field in result, f"Missing field: '{field}'", errors)

    grs   = result.get("grs")
    pd    = result.get("default_probability")
    pa    = result.get("approval_probability")
    ir    = result.get("interest_rate")
    amt   = result.get("max_amount")
    band  = result.get("grs_band")
    eq    = result.get("evidence_quality")
    top5  = result.get("top_5_reasons", [])
    coach = result.get("coaching_actions", [])

    # GRS range
    _check(isinstance(grs, int) and 300 <= grs <= 1000,
           f"GRS out of range or wrong type: {grs}", errors)

    # Band
    _check(band in _VALID_BANDS,
           f"Invalid grs_band: '{band}'", errors)

    # Evidence quality
    _check(eq in _VALID_EQ,
           f"Invalid evidence_quality: '{eq}'", errors)

    # PD: None or [0, 1]
    _check(pd is None or (isinstance(pd, (int, float)) and 0.0 <= pd <= 1.0),
           f"default_probability out of range: {pd}", errors)

    # P_Approve: None or [0, 1]
    _check(pa is None or (isinstance(pa, (int, float)) and 0.0 <= pa <= 1.0),
           f"approval_probability out of range: {pa}", errors)

    # Interest rate: [11, 30]
    _check(isinstance(ir, (int, float)) and 11.0 <= ir <= 30.0,
           f"interest_rate out of range: {ir}", errors)

    # Max amount: [5000, 200000]
    _check(isinstance(amt, int) and 5_000 <= amt <= 2_00_000,
           f"max_amount out of range: {amt}", errors)

    # Strings present
    _check(isinstance(result.get("worker_summary"), str) and len(result["worker_summary"]) > 0,
           "worker_summary is empty or missing", errors)
    _check(isinstance(result.get("lender_summary"), str) and len(result["lender_summary"]) > 0,
           "lender_summary is empty or missing", errors)
    _check(isinstance(result.get("gigtrust_id"), str) and result["gigtrust_id"].startswith("GT-"),
           f"gigtrust_id malformed: {result.get('gigtrust_id')}", errors)

    # Lists
    _check(isinstance(top5, list) and 1 <= len(top5) <= 5,
           f"top_5_reasons count invalid: {len(top5)}", errors)
    _check(isinstance(coach, list) and len(coach) >= 1,
           "coaching_actions is empty", errors)

    # Pillar scores
    pillar_scores = result.get("pillar_scores", {})
    for pillar in ("earning", "continuity", "service", "financial", "integrity"):
        score = pillar_scores.get(pillar)
        _check(
            isinstance(score, (int, float)) and 0.0 <= score <= 1.0,
            f"pillar_scores['{pillar}'] invalid: {score}",
            errors,
        )

    # Fraud flag type
    _check(isinstance(result.get("fraud_flag"), bool),
           f"fraud_flag must be bool, got: {type(result.get('fraud_flag'))}", errors)

    return errors


def run_integration_check() -> None:
    """Load sample input, run the pipeline, validate output, and report results.

    Exits with code 1 if any validation check fails.
    """
    print("=" * 60)
    print("GigScore ML Pipeline — Integration Check")
    print("=" * 60)

    # Load sample input
    if not _SAMPLE_INPUT_PATH.exists():
        print(f"ERROR: sample_input.json not found at {_SAMPLE_INPUT_PATH}")
        sys.exit(1)

    with _SAMPLE_INPUT_PATH.open("r", encoding="utf-8") as fh:
        sample = json.load(fh)

    print(f"Input  : {_SAMPLE_INPUT_PATH.name}  (worker_id={sample.get('worker_id')})")

    # Run pipeline with timing
    t0 = time.perf_counter()
    result = generate_financial_assessment(sample)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    print(f"Output : GRS={result.get('grs')}  band={result.get('grs_band')}  "
          f"amount=Rs.{result.get('max_amount'):,}  rate={result.get('interest_rate')}%")

    # Validate
    errors = validate_response(result)

    print()
    if errors:
        print("Integration: FAIL")
        for err in errors:
            print(f"  ✗ {err}")
        sys.exit(1)
    else:
        print(f"Integration: PASS")
        print(f"Inference  : {elapsed_ms:.1f} ms")
        print()
        print("Field summary:")
        for field in _REQUIRED_FIELDS:
            val = result.get(field)
            if isinstance(val, list):
                display: str = f"[{len(val)} items]"
            elif isinstance(val, dict):
                display = "{...}"
            else:
                display = str(val).encode("ascii", errors="replace").decode("ascii")
            print(f"  {field:<28} {display}")


if __name__ == "__main__":
    run_integration_check()
