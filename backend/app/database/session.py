"""Database session management"""

from sqlalchemy.orm import Session
from app.database.database import SessionLocal


def get_session() -> Session:
    """Get new database session"""
    return SessionLocal()
