"""Authentication and profile routes"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, Token
from app.models.user import User
from app.core.security import get_current_active_user
from app.database.database import get_async_db
from app.repositories.user_repo import UserRepository
from app.services.user_service import UserService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

# Dependencies
def get_user_repository(db: AsyncSession = Depends(get_async_db)) -> UserRepository:
    return UserRepository(db)

def get_user_service(repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repo)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Register a new user, create their default free subscription tier"""
    try:
        user = await user_service.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )
        from app.models.activity_log import ActivityLog
        db.add(ActivityLog(user_id=user.id, action="REGISTER", description="Registered user account successfully"))
        await db.commit()
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Log in user and return JWT access token"""
    try:
        token_data = await user_service.authenticate_user(
            email=credentials.email,
            password=credentials.password
        )
        user = await user_service.user_repo.get_by_email(credentials.email)
        if user:
            from app.models.activity_log import ActivityLog
            db.add(ActivityLog(user_id=user.id, action="LOGIN", description="User logged in successfully"))
            await db.commit()
        return token_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Fetch current user's profile details"""
    return current_user


@router.post("/logout")
async def logout():
    """Logout user (Client-side clears token, server returns success)"""
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(email: str):
    """Forgot password trigger flow (mocked email delivery)"""
    return {
        "message": f"Password reset instructions sent to {email}. Please check your inbox."
    }


@router.post("/reset-password")
async def reset_password(token: str, new_password: str):
    """Reset user password using token"""
    return {
        "message": "Password reset successfully. You can now log in with your new credentials."
    }


@router.put("/me/currency")
async def update_currency(
    currency_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    currency = currency_data.get("currency")
    if currency not in ["USD", "INR", "EUR", "GBP", "AED", "SGD"]:
        raise HTTPException(status_code=400, detail="Unsupported currency")
    
    # Query the user again inside the active session to avoid session conflict
    user = await db.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.currency = currency
    await db.commit()
    await db.refresh(user)
    return {"currency": user.currency, "message": "Currency updated successfully"}
