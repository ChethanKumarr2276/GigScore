"""M3 — Approval Probability model training and inference pipeline.

Logistic Regression (primary) / Random Forest (secondary) binary classifier.
Target: ``approved`` column in ``ml/data/processed/loans.csv``.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .config import PROCESSED_DATA_DIR, RANDOM_SEED
from .utils.logger import get_logger
from .utils.paths import get_model_path, get_output_path

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_LOANS_CSV: Path = PROCESSED_DATA_DIR / "loans.csv"
_MODEL_PATH: Path = get_model_path("m3_approval.pkl")
_METRICS_PATH: Path = get_output_path("m3_metrics.json")
_TARGET_COL: str = "approved"
_TEST_SIZE: float = 0.20
_CV_FOLDS: int = 5

# M3 feature set — income, activity, service quality, and financial health signals
# that directly influence lender approval decisions
_M3_FEATURES: list[str] = [
    # Income
    "monthly_income_avg",
    "income_volatility",
    "income_growth_rate",
    "income_trend",
    # Activity
    "active_day_ratio",
    "platform_tenure_months",
    "gigs_per_week",
    "multi_platform_count",
    # Service quality
    "average_rating",
    "completion_rate",
    "cancellation_rate",
    "on_time_rate",
    # Financial health
    "existing_emi",
    "emi_ratio",
    "bill_payment_ratio",
    "cash_flow_stability",
    "average_month_end_balance",
    # Risk / integrity
    "fraud_indicators",
    "identity_verified",
    "document_verified",
]

# Module-level model cache — populated after training or first disk load
_model_cache: Any = None


# ---------------------------------------------------------------------------
# Model factory
# ---------------------------------------------------------------------------

def _build_pipeline(use_random_forest: bool = False) -> tuple[Pipeline, str]:
    """Build a sklearn Pipeline wrapping a scaler and classifier.

    Logistic Regression is the default (interpretable, fast, well-calibrated).
    Random Forest is available as a secondary option via *use_random_forest*.

    Args:
        use_random_forest: When ``True``, use
            :class:`~sklearn.ensemble.RandomForestClassifier` instead of
            :class:`~sklearn.linear_model.LogisticRegression`.

    Returns:
        Tuple of ``(sklearn Pipeline, model name string)``.
    """
    if use_random_forest:
        clf = RandomForestClassifier(
            n_estimators=100,
            random_state=RANDOM_SEED,
            n_jobs=-1,
        )
        name = "RandomForest"
    else:
        clf = LogisticRegression(
            solver="lbfgs",
            max_iter=1000,
            random_state=RANDOM_SEED,
            class_weight="balanced",
        )
        name = "LogisticRegression"

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", clf),
    ])
    logger.info("Model selected: %s.", name)
    return pipe, name


def _param_grid(model_name: str) -> list[dict]:
    """Return a small GridSearchCV parameter grid for the named model.

    Args:
        model_name: ``"LogisticRegression"`` or ``"RandomForest"``.

    Returns:
        List of parameter dicts (Pipeline-namespaced keys).
    """
    if model_name == "LogisticRegression":
        return [
            {
                "classifier__C":       [0.01, 0.1, 1.0, 10.0],
                "classifier__penalty": ["l2"],
                "classifier__solver":  ["lbfgs", "liblinear"],
            },
        ]
    # RandomForest
    return [
        {
            "classifier__n_estimators": [100, 200],
            "classifier__max_depth":    [None, 5, 10],
            "classifier__min_samples_split": [2, 5],
        },
    ]


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
        ValueError: If the ``approved`` target column is absent.
    """
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"[M3] Dataset not found at: {csv_path}\n"
            "Place 'loans.csv' in ml/data/processed/ before running the pipeline.\n"
            "Expected columns include: worker_id, approved, and M3 feature columns."
        )

    df = pd.read_csv(csv_path)
    logger.info("Dataset loaded: %s | rows=%d cols=%d", csv_path.name, *df.shape)

    if _TARGET_COL not in df.columns:
        raise ValueError(
            f"[M3] Target column '{_TARGET_COL}' not found in {csv_path.name}. "
            f"Available columns: {list(df.columns)}"
        )
    return df


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Select, coerce, and impute M3 features plus the target column.

    Steps:

    1. Verify all required M3 feature columns are present.
    2. Coerce boolean columns to int (sklearn compatibility).
    3. Median-impute numeric NaN values.
    4. Drop rows where the target is null.

    Args:
        df: Raw DataFrame returned by :func:`load_data`.

    Returns:
        Cleaned DataFrame containing only ``_M3_FEATURES + [_TARGET_COL]``.

    Raises:
        ValueError: If any required M3 feature column is absent.
    """
    missing = [c for c in _M3_FEATURES if c not in df.columns]
    if missing:
        raise ValueError(
            f"[M3] Required feature columns missing from dataset: {missing}\n"
            "Ensure the feature engineering pipeline has run before M3 training."
        )

    keep_cols = _M3_FEATURES + [_TARGET_COL]
    df = df[keep_cols].copy()

    # Drop rows with null target
    null_target = df[_TARGET_COL].isna().sum()
    if null_target > 0:
        logger.warning("Dropping %d rows with null target.", null_target)
        df = df.dropna(subset=[_TARGET_COL])

    # Coerce booleans → int
    bool_cols = df.select_dtypes(include="bool").columns.tolist()
    df[bool_cols] = df[bool_cols].astype(int)

    # Median imputation for numeric features
    num_cols = df[_M3_FEATURES].select_dtypes(include="number").columns
    for col in num_cols:
        null_count = df[col].isna().sum()
        if null_count > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            logger.debug(
                "Imputed %d nulls in '%s' with median=%.4f.",
                null_count, col, median_val,
            )

    df[_TARGET_COL] = df[_TARGET_COL].astype(int)
    logger.info(
        "Preprocessing done | rows=%d | approval_rate=%.3f",
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
    X = df[_M3_FEATURES]
    y = df[_TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=_TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y,
    )
    logger.info(
        "Split | train=%d test=%d | train_ar=%.3f test_ar=%.3f",
        len(X_train), len(X_test),
        y_train.mean(), y_test.mean(),
    )
    return X_train, X_test, y_train, y_test


def train_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    use_random_forest: bool = False,
) -> tuple[Pipeline, str]:
    """Fit a base Logistic Regression pipeline on the training split.

    Args:
        X_train: Training feature matrix.
        y_train: Binary training labels (1 = approved).
        use_random_forest: Set ``True`` to use Random Forest instead.

    Returns:
        Tuple ``(fitted Pipeline, model name)``.
    """
    pipe, name = _build_pipeline(use_random_forest)

    # 5-fold stratified CV score before tuning (informational)
    cv = StratifiedKFold(n_splits=_CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="roc_auc")
    logger.info(
        "CV roc_auc | mean=%.4f std=%.4f (before tuning)",
        cv_scores.mean(),
        cv_scores.std(),
    )

    pipe.fit(X_train, y_train)
    logger.info("Base model trained: %s.", name)
    return pipe, name


def tune_hyperparameters(
    pipeline: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    model_name: str,
) -> Pipeline:
    """Run GridSearchCV over a small hyperparameter grid.

    Uses :data:`_CV_FOLDS`-fold StratifiedKFold and optimises ROC-AUC.

    Args:
        pipeline: Unfitted or fitted sklearn Pipeline.
        X_train: Training feature matrix.
        y_train: Binary training labels.
        model_name: ``"LogisticRegression"`` or ``"RandomForest"``
            — selects parameter grid.

    Returns:
        Best estimator (refitted Pipeline) from the grid search.
    """
    cv = StratifiedKFold(n_splits=_CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    param_grid = _param_grid(model_name)

    search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="roc_auc",
        cv=cv,
        refit=True,
        n_jobs=-1,
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
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str = "LogisticRegression",
) -> dict[str, Any]:
    """Compute classification metrics on the held-out test split.

    Metrics: Accuracy, Precision, Recall, ROC-AUC, Confusion Matrix.

    Args:
        pipeline: Fitted sklearn Pipeline with ``predict_proba`` support.
        X_test: Test feature matrix.
        y_test: True binary labels.
        model_name: Label stored in the output JSON.

    Returns:
        Metrics dictionary conforming to the M3 output contract.
    """
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    cm = confusion_matrix(y_test, y_pred).tolist()
    metrics: dict[str, Any] = {
        "model":            model_name,
        "accuracy":         round(float(accuracy_score(y_test, y_pred)), 4),
        "precision":        round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":           round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc":          round(float(roc_auc_score(y_test, y_prob)), 4),
        "confusion_matrix": cm,
    }

    logger.info(
        "Evaluation | accuracy=%.4f precision=%.4f recall=%.4f roc_auc=%.4f",
        metrics["accuracy"],
        metrics["precision"],
        metrics["recall"],
        metrics["roc_auc"],
    )
    return metrics


def save_model(pipeline: Pipeline, path: Path = _MODEL_PATH) -> Path:
    """Serialise the fitted pipeline to disk using joblib.

    Args:
        pipeline: Fitted sklearn Pipeline.
        path: Destination file path. Defaults to ``ml/models/m3_approval.pkl``.

    Returns:
        Resolved :class:`pathlib.Path` where the model was saved.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, path)
    logger.info("Model saved: %s", path)
    return path


def _save_metrics(metrics: dict[str, Any], path: Path = _METRICS_PATH) -> Path:
    """Write evaluation metrics to a JSON file.

    Args:
        metrics: Dict returned by :func:`evaluate_model`.
        path: Destination file path. Defaults to ``ml/outputs/m3_metrics.json``.

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
    use_random_forest: bool = False,
) -> dict[str, Any]:
    """Execute the complete M3 training pipeline end-to-end.

    Steps:

    1. Load data
    2. Preprocess
    3. Split (stratified 80/20)
    4. Train base Logistic Regression pipeline
    5. Tune hyperparameters via GridSearchCV (optional)
    6. Evaluate on held-out test split
    7. Save model to ``ml/models/m3_approval.pkl``
    8. Save metrics to ``ml/outputs/m3_metrics.json``

    Args:
        data_path: Path to ``loans.csv``. Defaults to the canonical path.
        tune: Whether to run GridSearchCV tuning. Set ``False`` for fast debug runs.
        use_random_forest: Use Random Forest instead of Logistic Regression.

    Returns:
        Metrics dictionary from :func:`evaluate_model`.
    """
    global _model_cache

    logger.info("=== M3 Training Pipeline START ===")

    df = load_data(data_path)
    df = preprocess_data(df)
    X_train, X_test, y_train, y_test = split_data(df)

    pipeline, model_name = train_model(X_train, y_train, use_random_forest)

    if tune:
        logger.info("Tuning hyperparameters (GridSearchCV, cv=%d) ...", _CV_FOLDS)
        pipeline = tune_hyperparameters(pipeline, X_train, y_train, model_name)
    else:
        logger.info("Skipping hyperparameter tuning (tune=False).")

    metrics = evaluate_model(pipeline, X_test, y_test, model_name)
    save_model(pipeline)
    _save_metrics(metrics)
    _model_cache = pipeline

    logger.info("=== M3 Training Pipeline COMPLETE ===")
    return metrics


# ---------------------------------------------------------------------------
# Inference API
# ---------------------------------------------------------------------------

def _load_model(path: Path = _MODEL_PATH) -> Pipeline:
    """Load a serialised pipeline from disk, using the module cache when available.

    Args:
        path: Path to the ``.pkl`` artefact.

    Returns:
        Fitted sklearn Pipeline.

    Raises:
        FileNotFoundError: If no model artefact exists at *path*.
    """
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"[M3] No trained model found at: {path}\n"
            "Run ml.m3_approval_model.run_training_pipeline() first."
        )

    _model_cache = joblib.load(path)
    logger.info("Model loaded from disk: %s", path)
    return _model_cache


def predict_approval_probability(features: dict[str, Any]) -> float:
    """Return the Probability of Approval (P_Approve) for a single gig worker.

    Loads the serialised pipeline on first call and caches it for subsequent calls.

    Args:
        features: Feature dict. Keys must include all entries in ``_M3_FEATURES``.
            Extra keys (e.g., M1-only or M2-only features) are silently ignored.

    Returns:
        Calibrated approval probability in [0, 1].

    Raises:
        KeyError: If any required M3 feature is absent from *features*.
        FileNotFoundError: If the model artefact does not exist.
    """
    missing = [f for f in _M3_FEATURES if f not in features]
    if missing:
        raise KeyError(
            f"[M3] predict_approval_probability: missing required features: {missing}"
        )

    pipeline = _load_model()

    row = pd.DataFrame(
        [[features[f] for f in _M3_FEATURES]],
        columns=_M3_FEATURES,
    )
    # Coerce any bool columns to int — matches training preprocessing
    for col in row.select_dtypes(include="bool").columns:
        row[col] = row[col].astype(int)

    prob: float = float(pipeline.predict_proba(row)[:, 1][0])
    logger.debug("predict_approval_probability: p_approve=%.4f", prob)
    return prob
