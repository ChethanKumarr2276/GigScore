"""Path utilities for GigScore."""

from pathlib import Path

from ..config import (
    DATA_DIR,
    MODEL_DIR,
    OUTPUT_DIR,
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
)


def ensure_directories() -> None:
    """Create all required project directories if they do not exist."""
    for path in [
        DATA_DIR,
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODEL_DIR,
        OUTPUT_DIR,
    ]:
        Path(path).mkdir(parents=True, exist_ok=True)


def get_data_path(filename: str = "", processed: bool = False) -> Path:
    """Return a path inside the raw or processed data directory."""
    base = PROCESSED_DATA_DIR if processed else RAW_DATA_DIR
    return Path(base) / filename


def get_model_path(filename: str = "") -> Path:
    """Return a path inside the models directory."""
    return Path(MODEL_DIR) / filename


def get_output_path(filename: str = "") -> Path:
    """Return a path inside the outputs directory."""
    return Path(OUTPUT_DIR) / filename