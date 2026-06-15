"""Startup schema"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StartupCreate(BaseModel):
    """Startup creation schema"""

    name: str
    description: str  # represents the main startup idea/concept
    industry: str
    budget: str
    country: str
    target_audience: str


class StartupUpdate(BaseModel):
    """Startup update schema"""

    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    budget: Optional[str] = None
    country: Optional[str] = None
    target_audience: Optional[str] = None
    status: Optional[str] = None


class StartupResponse(BaseModel):
    """Startup response schema"""

    id: str
    user_id: str
    name: str
    description: str
    industry: str
    budget: str
    country: str
    target_audience: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
