"""Data validators"""

import re
from typing import Any, List


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_startup_name(name: str) -> bool:
    """Validate startup name"""
    return isinstance(name, str) and len(name) > 0 and len(name) <= 255


def validate_url(url: str) -> bool:
    """Validate URL format"""
    pattern = r"^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    return re.match(pattern, url) is not None


def validate_positive_number(value: Any) -> bool:
    """Validate positive number"""
    try:
        return float(value) > 0
    except (ValueError, TypeError):
        return False


def validate_list_not_empty(lst: List) -> bool:
    """Validate list is not empty"""
    return isinstance(lst, list) and len(lst) > 0
