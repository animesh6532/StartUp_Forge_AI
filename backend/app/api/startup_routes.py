"""Startup management API routes"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.startup_schema import StartupCreate, StartupUpdate, StartupResponse
from app.models.startup import Startup
from app.models.user import User
from app.core.security import get_current_active_user
from app.database.database import get_async_db
from app.repositories.startup_repo import StartupRepository
from app.services.startup_service import StartupService
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

router = APIRouter()

# Dependencies
def get_startup_repository(db: AsyncSession = Depends(get_async_db)) -> StartupRepository:
    return StartupRepository(db)

def get_startup_service(repo: StartupRepository = Depends(get_startup_repository)) -> StartupService:
    return StartupService(repo)


@router.post("", response_model=StartupResponse, status_code=status.HTTP_201_CREATED)
async def create_startup(
    startup_data: StartupCreate,
    current_user: User = Depends(get_current_active_user),
    startup_service: StartupService = Depends(get_startup_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new startup concept linked to the current user"""
    res = await startup_service.create_startup(
        name=startup_data.name,
        description=startup_data.description,
        industry=startup_data.industry,
        budget=startup_data.budget,
        country=startup_data.country,
        target_audience=startup_data.target_audience,
        current_user=current_user
    )
    from app.models.activity_log import ActivityLog
    db.add(ActivityLog(user_id=current_user.id, action="CREATE_STARTUP", description=f"Forged a new startup workspace '{res.name}'"))
    await db.commit()
    return res


@router.get("/{startup_id}", response_model=StartupResponse)
async def get_startup(
    startup_id: str,
    current_user: User = Depends(get_current_active_user),
    startup_service: StartupService = Depends(get_startup_service)
):
    """Retrieve startup concept by ID (owner or admin only)"""
    try:
        return await startup_service.get_startup(startup_id, current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("", response_model=List[StartupResponse])
async def list_startups(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    startup_service: StartupService = Depends(get_startup_service)
):
    """List startup concepts (owners list their own, admins list all)"""
    return await startup_service.list_startups(current_user, skip, limit)


@router.put("/{startup_id}", response_model=StartupResponse)
async def update_startup(
    startup_id: str,
    startup_data: StartupUpdate,
    current_user: User = Depends(get_current_active_user),
    startup_service: StartupService = Depends(get_startup_service)
):
    """Update startup details by ID (owner or admin only)"""
    try:
        update_dict = startup_data.model_dump(exclude_unset=True)
        return await startup_service.update_startup(startup_id, update_dict, current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{startup_id}", status_code=status.HTTP_200_OK)
async def delete_startup(
    startup_id: str,
    current_user: User = Depends(get_current_active_user),
    startup_service: StartupService = Depends(get_startup_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a startup concept (owner or admin only)"""
    try:
        startup = await startup_service.get_startup(startup_id, current_user)
        startup_name = startup.name
        await startup_service.delete_startup(startup_id, current_user)
        from app.models.activity_log import ActivityLog
        db.add(ActivityLog(user_id=current_user.id, action="DELETE_STARTUP", description=f"Deleted startup workspace '{startup_name}'"))
        await db.commit()
        return {"message": "Startup deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
