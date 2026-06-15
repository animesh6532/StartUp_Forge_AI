"""User schema"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """User creation schema"""

    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    """User login schema"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema"""

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    currency: Optional[str] = "USD"
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token schema"""

    access_token: str
    token_type: str
    expires_in: Optional[int] = None
