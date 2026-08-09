"""M2 — Probability of Default (PD) model training and inference pipeline.

XGBoost (primary) / LightGBM (fallback) binary classifier.
Target: ``defaulted`` column in ``ml/data/processed/loans.csv``.
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path
from typing import Any

# pyrefly: ignore [missing-import]
import joblib
# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    RandomizedSearchCV,
    StratifiedKFold,
    train_test_split,
)

from .config import PROCESSED_DATA_DIR, RANDOM_SEED
from .utils.logger import get_logger
from .utils.paths import get_model_path, get_output_path

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_LOANS_CSV: Path = PROCESSED_DATA_DIR / "loans.csv"
_MODEL_PATH: Path = get_model_path("m2_default.pkl")
_METRICS_PATH: Path = get_output_path("m2_metrics.json")
_TARGET_COL: str = "defaulted"
_TEST_SIZE: float = 0.20
_CV_FOLDS: int = 5
_N_ITER: int = 20  # RandomizedSearchCV iterations — kept low for hackathon speed

# M2 feature set (subset of the canonical schema used for default prediction)
_M2_FEATURES: list[str] = [
    "monthly_income_avg",
    "monthly_income_std",
    "income_volatility",
    "income_per_active_day",
    "active_day_ratio",
    "longest_inactive_gap",
    "platform_tenure_months",
    "gigs_per_week",
    "average_rating",
    "completion_rate",
    "cancellation_rate",
    "acceptance_rate",
    "existing_emi",
    "emi_ratio",
    "bill_payment_ratio",
    "cash_flow_stability",
    "balance_volatility",
    "penalty_events",
    "chargebacks",
    "fraud_indicators",
]

# Module-level model cache (populated after training or first load)
_model_cache: Any = None


# ---------------------------------------------------------------------------
# Model factory
# ---------------------------------------------------------------------------

def _build_model() -> tuple[Any, str]:
    """Instantiate XGBoost classifier, falling back to LightGBM if unavailable.

    Returns:
        Tuple of (unfitted model instance, model name string).
    """
    try:
        from xgboost import XGBClassifier  # type: ignore

        model = XGBClassifier(
            objective="binary:logistic",
            eval_metric="logloss",
            use_label_encoder=False,
            random_state=RANDOM_SEED,
            verbosity=0,
        )
        logger.info("Primary model selected: XGBoost.")
        return model, "XGBoost"
    except ImportError:
        warnings.warn("XGBoost not found — falling back to LightGBM.", stacklevel=2)
        from lightgbm import LGBMClassifier  # type: ignore

        model = LGBMClassifier(
            objective="binary",
            random_state=RANDOM_SEED,
            verbose=-1,
        )
        logger.info("Fallback model selected: LightGBM.")
        return model, "LightGBM"


def _param_grid(model_name: str) -> dict[str, list]:
    """Return a small random search parameter space keyed by model name.

    Args:
        model_name: ``"XGBoost"`` or ``"LightGBM"``.

    Returns:
        Dict of hyperparameter names to search distributions.
    """
    if model_name == "XGBoost":
        return {
            "n_estimators":      [100, 200, 300],
            "max_depth":         [3, 4, 5, 6],
            "learning_rate":     [0.01, 0.05, 0.1, 0.2],
            "subsample":         [0.7, 0.8, 1.0],
            "colsample_bytree":  [0.7, 0.8, 1.0],
            "min_child_weight":  [1, 3, 5],
            "scale_pos_weight":  [1, 2, 3],
        }
    return {
        "n_estimators":   [100, 200, 300],
        "max_depth":      [3, 4, 5, 6],
        "learning_rate":  [0.01, 0.05, 0.1, 0.2],
        "subsample":      [0.7, 0.8, 1.0],
        "num_leaves":     [15, 31, 63],
        "min_child_samples": [5, 10, 20],
    }


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

def load_data(path: str | Path = _LOANS_CSV) -> pd.DataFrame:
    """Load the processed loans CSV from disk.

    Args:
        path: Path to ``loans.csv``. Defaults to the canonical processed path.

    Returns:
        Raw :class:`pandas.DataFrame`.

    Raises:
        FileNotFoundError: If the file does not exist at *path*.
        ValueError: If the ``defaulted`` target column is absent.
    """
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"[M2] Dataset not found at: {csv_path}\n"
            "Place 'loans.csv' in ml/data/processed/ before running the pipeline.\n"
            "Expected columns include: worker_id, defaulted, and M2 feature columns."
        )

    df = pd.read_csv(csv_path)
    logger.info("Dataset loaded: %s | rows=%d cols=%d", csv_path.name, *df.shape)

    if _TARGET_COL not in df.columns:
        raise ValueError(
            f"[M2] Target column '{_TARGET_COL}' not found in {csv_path.name}. "
            f"Available columns: {list(df.columns)}"
        )
    return df


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Select, coerce, and impute M2 features plus the target column.

    Steps:
    1. Verify all required M2 features are present.
    2. Coerce bool columns to int (sklearn compatibility).
    3. Impute median for numeric NaN values.
    4. Drop rows where the target is null.

    Args:
        df: Raw DataFrame returned by :func:`load_data`.

    Returns:
        Cleaned DataFrame containing only ``_M2_FEATURES + [_TARGET_COL]``.

    Raises:
        ValueError: If any required M2 feature column is missing.
    """
    missing = [c for c in _M2_FEATURES if c not in df.columns]
    if missing:
        raise ValueError(
            f"[M2] Required feature columns missing from dataset: {missing}\n"
            "Ensure the feature engineering pipeline has run before M2 training."
        )

    keep_cols = _M2_FEATURES + [_TARGET_COL]
    df = df[keep_cols].copy()

    # Drop rows with null target
    null_target = df[_TARGET_COL].isna().sum()
    if null_target > 0:
        logger.warning("Dropping %d rows with null target.", null_target)
        df = df.dropna(subset=[_TARGET_COL])

    # Coerce booleans → int
    bool_cols = df.select_dtypes(include="bool").columns.tolist()
    df[bool_cols] = df[bool_cols].astype(int)

    # Median imputation for numeric columns
    num_cols = df[_M2_FEATURES].select_dtypes(include="number").columns
    for col in num_cols:
        null_count = df[col].isna().sum()
        if null_count > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            logger.debug("Imputed %d nulls in '%s' with median=%.4f.", null_count, col, median_val)

    df[_TARGET_COL] = df[_TARGET_COL].astype(int)
    logger.info(
        "Preprocessing done | rows=%d | default_rate=%.3f",
        len(df),
        df[_TARGET_COL].mean(),
    )
    return df


def split_data(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Stratified 80/20 train-test split on the preprocessed DataFrame.

    Args:
        df: Preprocessed DataFrame from :func:`preprocess_data`.

    Returns:
        Tuple ``(X_train, X_test, y_train, y_test)``.
    """
    X = df[_M2_FEATURES]
    y = df[_TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=_TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y,
    )
    logger.info(
        "Split | train=%d test=%d | train_dr=%.3f test_dr=%.3f",
        len(X_train), len(X_test),
        y_train.mean(), y_test.mean(),
    )
    return X_train, X_test, y_train, y_test


def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> tuple[Any, str]:
    """Fit a base classifier without hyperparameter tuning.

    Args:
        X_train: Training feature matrix.
        y_train: Binary training labels.

    Returns:
        Tuple ``(fitted_model, model_name)``.
    """
    model, name = _build_model()
    model.fit(X_train, y_train)
    logger.info("Base model trained: %s.", name)
    return model, name


def tune_hyperparameters(
    model: Any,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    model_name: str,
) -> Any:
    """Run RandomizedSearchCV over a small hyperparameter grid.

    Uses :data:`_CV_FOLDS`-fold StratifiedKFold and optimises ROC-AUC.

    Args:
        model: Unfitted or fitted model instance.
        X_train: Training feature matrix.
        y_train: Binary training labels.
        model_name: ``"XGBoost"`` or ``"LightGBM"`` — selects param grid.

    Returns:
        Best estimator from the search.
    """
    cv = StratifiedKFold(n_splits=_CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    param_dist = _param_grid(model_name)

    search = RandomizedSearchCV(
        estimator=model,
        param_distributions=param_dist,
        n_iter=_N_ITER,
        scoring="roc_auc",
        cv=cv,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        refit=True,
        verbose=0,
    )
    search.fit(X_train, y_train)

    logger.info(
        "Tuning complete | best_roc_auc=%.4f | params=%s",
        search.best_score_,
        search.best_params_,
    )
    return search.best_estimator_


def evaluate_model(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str = "XGBoost",
) -> dict[str, Any]:
    """Compute classification and calibration metrics on the test split.

    Metrics:
    * ROC-AUC
    * KS Statistic (max separation between TPR and FPR curves)
    * Precision, Recall, F1 (threshold 0.5)
    * Accuracy
    * Confusion matrix

    Args:
        model: Fitted model with ``predict_proba`` support.
        X_test: Test feature matrix.
        y_test: True binary labels.
        model_name: Label stored in the output JSON.

    Returns:
        Metrics dictionary conforming to the M2 output contract.
    """
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    # KS statistic
    pos_mask = y_test == 1
    neg_mask = y_test == 0
    pos_probs = np.sort(y_prob[pos_mask])
    neg_probs = np.sort(y_prob[neg_mask])
    thresholds = np.unique(y_prob)
    ks = 0.0
    for t in thresholds:
        tpr = float((pos_probs >= t).mean()) if pos_mask.any() else 0.0
        fpr = float((neg_probs >= t).mean()) if neg_mask.any() else 0.0
        ks = max(ks, abs(tpr - fpr))

    cm = confusion_matrix(y_test, y_pred).tolist()
    metrics: dict[str, Any] = {
        "model":            model_name,
        "roc_auc":          round(float(roc_auc_score(y_test, y_prob)), 4),
        "ks":               round(ks, 4),
        "precision":        round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":           round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1":               round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "accuracy":         round(float(accuracy_score(y_test, y_pred)), 4),
        "confusion_matrix": cm,
    }

    logger.info(
        "Evaluation | roc_auc=%.4f ks=%.4f precision=%.4f recall=%.4f f1=%.4f accuracy=%.4f",
        metrics["roc_auc"], metrics["ks"], metrics["precision"],
        metrics["recall"], metrics["f1"], metrics["accuracy"],
    )
    return metrics


def save_model(model: Any, path: Path = _MODEL_PATH) -> Path:
    """Serialise the fitted model to disk using joblib.

    Args:
        model: Fitted model object.
        path: Destination file path. Defaults to ``ml/models/m2_default.pkl``.

    Returns:
        Resolved :class:`pathlib.Path` where the model was saved.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    logger.info("Model saved: %s", path)
    return path


def _save_metrics(metrics: dict[str, Any], path: Path = _METRICS_PATH) -> Path:
    """Write evaluation metrics to a JSON file.

    Args:
        metrics: Dict returned by :func:`evaluate_model`.
        path: Destination file path. Defaults to ``ml/outputs/m2_metrics.json``.

    Returns:
        Resolved :class:`pathlib.Path` where metrics were saved.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
    logger.info("Metrics saved: %s", path)
    return path


# ---------------------------------------------------------------------------
# Full training pipeline
# ---------------------------------------------------------------------------

def run_training_pipeline(
    data_path: str | Path = _LOANS_CSV,
    tune: bool = True,
) -> dict[str, Any]:
    """Execute the complete M2 training pipeline end-to-end.

    Steps:
    1. Load data
    2. Preprocess
    3. Split (stratified 80/20)
    4. Train base model
    5. Tune hyperparameters (optional)
    6. Evaluate on test split
    7. Save model artifact to ``ml/models/m2_default.pkl``
    8. Save metrics to ``ml/outputs/m2_metrics.json``

    Args:
        data_path: Path to ``loans.csv``. Defaults to the canonical path.
        tune: Whether to run RandomizedSearchCV. Set ``False`` for fast debug runs.

    Returns:
        Metrics dictionary from :func:`evaluate_model`.
    """
    global _model_cache

    logger.info("=== M2 Training Pipeline START ===")

    df = load_data(data_path)
    df = preprocess_data(df)
    X_train, X_test, y_train, y_test = split_data(df)

    base_model, model_name = train_model(X_train, y_train)

    if tune:
        logger.info("Tuning hyperparameters (n_iter=%d, cv=%d) ...", _N_ITER, _CV_FOLDS)
        best_model = tune_hyperparameters(base_model, X_train, y_train, model_name)
    else:
        logger.info("Skipping hyperparameter tuning (tune=False).")
        best_model = base_model

    metrics = evaluate_model(best_model, X_test, y_test, model_name)
    save_model(best_model)
    _save_metrics(metrics)
    _model_cache = best_model

    logger.info("=== M2 Training Pipeline COMPLETE ===")
    return metrics


# ---------------------------------------------------------------------------
# Inference API
# ---------------------------------------------------------------------------

def _load_model(path: Path = _MODEL_PATH) -> Any:
    """Load a serialised model from disk, using the module cache when available.

    Args:
        path: Path to the ``.pkl`` artefact.

    Returns:
        Fitted model object.

    Raises:
        FileNotFoundError: If no model artefact exists at *path*.
    """
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"[M2] No trained model found at: {path}\n"
            "Run ml.m2_default_model.run_training_pipeline() first."
        )

    _model_cache = joblib.load(path)
    logger.info("Model loaded from disk: %s", path)
    return _model_cache


def predict_default_probability(features: dict[str, Any]) -> float:
    """Return the Probability of Default (PD) for a single gig worker.

    Loads the serialised model on first call and caches it for subsequent calls.

    Args:
        features: Feature dict. Keys must include all entries in ``_M2_FEATURES``.
            Accepts the full canonical feature vector (extra keys are ignored).

    Returns:
        Calibrated probability of default in [0, 1].

    Raises:
        KeyError: If any required M2 feature is absent from *features*.
        FileNotFoundError: If the model artefact does not exist.
    """
    missing = [f for f in _M2_FEATURES if f not in features]
    if missing:
        raise KeyError(
            f"[M2] predict_default_probability: missing required features: {missing}"
        )

    model = _load_model()

    row = pd.DataFrame(
        [[features[f] for f in _M2_FEATURES]],
        columns=_M2_FEATURES,
    )
    # Coerce any bool columns to int (matches training preprocessing)
    for col in row.select_dtypes(include="bool").columns:
        row[col] = row[col].astype(int)

    prob: float = float(model.predict_proba(row)[:, 1][0])
    logger.debug("predict_default_probability: pd=%.4f", prob)
    return prob
