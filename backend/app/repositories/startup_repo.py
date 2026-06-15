from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.startup import Startup
from typing import List, Optional

class StartupRepository:
    """Repository for startup data access operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, startup_id: str) -> Optional[Startup]:
        result = await self.db.execute(select(Startup).filter(Startup.id == startup_id))
        return result.scalars().first()

    async def list_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Startup]:
        result = await self.db.execute(
            select(Startup)
            .filter(Startup.user_id == user_id)
            .order_by(Startup.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Startup]:
        result = await self.db.execute(
            select(Startup)
            .order_by(Startup.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, startup: Startup) -> Startup:
        self.db.add(startup)
        await self.db.commit()
        await self.db.refresh(startup)
        return startup

    async def update(self, startup: Startup) -> Startup:
        self.db.add(startup)
        await self.db.commit()
        await self.db.refresh(startup)
        return startup

    async def delete(self, startup: Startup) -> None:
        await self.db.delete(startup)
        await self.db.commit()
