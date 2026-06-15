from app.repositories.startup_repo import StartupRepository
from app.models.startup import Startup
from app.models.user import User
from typing import List, Optional

class StartupService:
    """Service for handling startup business logic operations"""

    def __init__(self, startup_repo: StartupRepository):
        self.startup_repo = startup_repo

    async def get_startup(self, startup_id: str, current_user: User) -> Startup:
        startup = await self.startup_repo.get_by_id(startup_id)
        if not startup:
            raise ValueError(f"Startup with ID '{startup_id}' not found")
        if str(startup.user_id) != str(current_user.id) and current_user.role != "admin":
            raise PermissionError("Not authorized to access this startup idea")
        return startup

    async def create_startup(self, name: str, description: str, industry: str, budget: str, country: str, target_audience: str, current_user: User) -> Startup:
        new_startup = Startup(
            user_id=current_user.id,
            name=name,
            description=description,
            industry=industry,
            budget=budget,
            country=country,
            target_audience=target_audience,
            status="draft"
        )
        return await self.startup_repo.create(new_startup)

    async def list_startups(self, current_user: User, skip: int = 0, limit: int = 10) -> List[Startup]:
        if current_user.role == "admin":
            return await self.startup_repo.list_all(skip, limit)
        return await self.startup_repo.list_by_user_id(current_user.id, skip, limit)

    async def update_startup(self, startup_id: str, update_data: dict, current_user: User) -> Startup:
        startup = await self.get_startup(startup_id, current_user)
        for key, value in update_data.items():
            if value is not None:
                setattr(startup, key, value)
        return await self.startup_repo.update(startup)

    async def delete_startup(self, startup_id: str, current_user: User) -> None:
        startup = await self.get_startup(startup_id, current_user)
        await self.startup_repo.delete(startup)
