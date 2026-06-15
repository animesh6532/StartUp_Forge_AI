"""Logging configuration"""

import logging
from app.core.config import settings

logging.basicConfig(
    level=settings.DEBUG and logging.DEBUG or logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)
