import pytest
from app.database.database import AsyncSessionLocal, init_db
from app.repositories.user_repo import UserRepository
from app.repositories.startup_repo import StartupRepository
from app.models.user import User
from app.models.startup import Startup
import uuid

@pytest.mark.asyncio
async def test_db_repositories_async():
    """Verify UserRepository and StartupRepository work with AsyncSession"""
    # 1. Initialize tables
    init_db()
    
    # 2. Open Async Session
    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        startup_repo = StartupRepository(session)
        
        test_email = f"user_{uuid.uuid4().hex[:6]}@test.com"
        
        # Create user
        new_user = User(
            email=test_email,
            full_name="Integration Test User",
            hashed_password="hashedpassword123",
            role="user"
        )
        user = await user_repo.create(new_user)
        assert user.id is not None
        assert user.email == test_email
        
        # Retrieve user
        retrieved_user = await user_repo.get_by_email(test_email)
        assert retrieved_user is not None
        assert retrieved_user.id == user.id
        
        # Create startup
        new_startup = Startup(
            user_id=user.id,
            name="Async Startup",
            description="Integration testing async postgres pipelines.",
            industry="Software",
            budget="Low",
            country="US",
            target_audience="Developers",
            status="draft"
        )
        startup = await startup_repo.create(new_startup)
        assert startup.id is not None
        assert startup.name == "Async Startup"
        
        # Retrieve startup
        retrieved_startup = await startup_repo.get_by_id(startup.id)
        assert retrieved_startup is not None
        assert retrieved_startup.name == "Async Startup"
        
        # Clean up
        await session.delete(retrieved_startup)
        await session.delete(retrieved_user)
        await session.commit()
