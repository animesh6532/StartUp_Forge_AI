from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.models.subscription import Subscription
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import datetime, timedelta
from typing import Optional

class UserService:
    """Service for handling user-related operations"""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register_user(self, email: str, password: str, full_name: str) -> User:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ValueError("A user with this email is already registered")

        user_count = await self.user_repo.get_count()
        default_role = "admin" if user_count == 0 else "user"

        new_user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=default_role,
            is_active=True,
        )
        user = await self.user_repo.create(new_user)

        # Create subscription
        subscription = Subscription(
            user_id=user.id,
            plan_name="free",
            status="active",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=365),
        )
        await self.user_repo.create_subscription(subscription)

        return user

    async def authenticate_user(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Incorrect email or password")
        if not user.is_active:
            raise ValueError("User account is deactivated")

        access_token = create_access_token(
            data={"sub": user.email, "role": user.role}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 30 * 60,
        }

    async def get_user_by_id(self, user_id: str) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return user
