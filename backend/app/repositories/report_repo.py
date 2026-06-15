from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.report import Report
from app.models.startup import Startup
from typing import List, Optional

class ReportRepository:
    """Repository for report data access operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, report_id: str) -> Optional[Report]:
        result = await self.db.execute(select(Report).filter(Report.id == report_id))
        return result.scalars().first()

    async def list_by_startup_id(self, startup_id: str) -> List[Report]:
        result = await self.db.execute(
            select(Report)
            .filter(Report.startup_id == startup_id)
            .order_by(Report.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_user_id(self, user_id: str, startup_id: Optional[str] = None) -> List[Report]:
        query = select(Report).join(Startup).filter(Startup.user_id == user_id)
        if startup_id:
            query = query.filter(Report.startup_id == startup_id)
        result = await self.db.execute(query.order_by(Report.created_at.desc()))
        return list(result.scalars().all())

    async def list_all(self, startup_id: Optional[str] = None) -> List[Report]:
        query = select(Report)
        if startup_id:
            query = query.filter(Report.startup_id == startup_id)
        result = await self.db.execute(query.order_by(Report.created_at.desc()))
        return list(result.scalars().all())

    async def create(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def update(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report
