"""Data formatters"""

from typing import Dict, Any, List
import json


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format amount as currency"""
    symbols = {"USD": "$", "EUR": "€", "GBP": "£"}
    symbol = symbols.get(currency, currency)
    return f"{symbol}{amount:,.2f}"


def format_percentage(value: float, decimals: int = 2) -> str:
    """Format as percentage"""
    return f"{value:.{decimals}f}%"


def format_large_number(num: int) -> str:
    """Format large numbers"""
    if num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    return str(num)


def format_json(data: Dict[str, Any]) -> str:
    """Format as JSON string"""
    return json.dumps(data, indent=2)


def truncate_text(text: str, length: int = 100) -> str:
    """Truncate text"""
    if len(text) <= length:
        return text
    return text[:length] + "..."
