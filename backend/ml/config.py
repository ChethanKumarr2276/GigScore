"""Central configuration for GigScore ML pipeline."""

from pathlib import Path

PROJECT_ROOT: Path = Path(__file__).resolve().parent
DATA_DIR: Path = PROJECT_ROOT / "data"
MODEL_DIR: Path = PROJECT_ROOT / "models"
OUTPUT_DIR: Path = PROJECT_ROOT / "outputs"

RANDOM_SEED: int = 42
LOG_LEVEL: str = "INFO"

RAW_DATA_DIR: Path = DATA_DIR / "raw"
PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
