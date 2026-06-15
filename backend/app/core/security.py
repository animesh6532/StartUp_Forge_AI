"""Security utilities and authentication dependencies"""

from datetime import datetime, timedelta
from typing import Optional, List

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use Bearer Token Authentication
oauth2_scheme = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


import time

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT token"""

    to_encode = data.copy()

    if expires_delta:
        expire = int(time.time() + expires_delta.total_seconds())
    else:
        expire = int(time.time() + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str):
    """Decode JWT token"""

    try:
        token = token.strip()
        if token.lower().startswith("bearer "):
            token = token[7:].strip()

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload

    except JWTError:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""

    actual_token = None
    if credentials:
        actual_token = credentials.credentials
    elif token:
        actual_token = token

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not actual_token:
        raise credentials_exception

    payload = decode_token(actual_token)

    if payload is None:
        raise credentials_exception

    email = payload.get("sub")

    if email is None:
        raise credentials_exception

    from app.models.user import User

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user=Depends(get_current_user)
):
    """Ensure user is active"""

    if not current_user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )

    return current_user


class RoleChecker:
    """Role Based Access Control"""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user=Depends(get_current_active_user)
    ):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )

        return current_user


require_admin = RoleChecker(["admin"])
require_premium = RoleChecker(["premium_user", "admin"])
require_any_user = RoleChecker(["user", "premium_user", "admin"])