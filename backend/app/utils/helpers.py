"""Helper utilities"""

import uuid
from typing import Any, Dict, List
from app.core.logger import logger


def generate_id() -> str:
    """Generate unique ID"""
    return str(uuid.uuid4())


def chunks(lst: List[Any], n: int) -> List[List[Any]]:
    """Divide list into chunks"""
    return [lst[i : i + n] for i in range(0, len(lst), n)]


def safe_dict_get(d: Dict, key: str, default: Any = None) -> Any:
    """Safely get dictionary value"""
    try:
        return d.get(key, default)
    except AttributeError:
        return default


async def retry_async(func, max_retries: int = 3, delay: float = 1.0):
    """Retry async function"""
    import asyncio

    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Max retries exceeded: {e}")
                raise
            logger.warning(f"Retry {attempt + 1}/{max_retries}")
            await asyncio.sleep(delay)
