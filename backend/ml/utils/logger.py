"""Reusable logger factory for GigScore ML modules."""

import logging
import sys
from typing import Optional

from ..config import LOG_LEVEL


def get_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Return a configured logger with timestamped output.

    Args:
        name: Logger name, typically __name__ of the calling module.
        level: Override log level; falls back to config.LOG_LEVEL.

    Returns:
        Configured logging.Logger instance.
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    resolved_level = getattr(logging, (level or LOG_LEVEL).upper(), logging.INFO)
    logger.setLevel(resolved_level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(resolved_level)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False

    return logger