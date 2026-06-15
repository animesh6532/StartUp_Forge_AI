from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.models.subscription import Subscription
from typing import Optional

class UserRepository:
    """Repository for user data access operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_count(self) -> int:
        result = await self.db.execute(select(User))
        return len(result.scalars().all())

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def create_subscription(self, subscription: Subscription) -> Subscription:
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription
