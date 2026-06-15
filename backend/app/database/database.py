"""Database configuration and setup"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# For sqlite compatibility if needed, or normal postgres
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# For sqlite compatibility if needed, or normal postgres
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20 if not settings.DATABASE_URL.startswith("sqlite") else None,
    max_overflow=40 if not settings.DATABASE_URL.startswith("sqlite") else None,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_async_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url

async_engine = create_async_engine(
    get_async_database_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    pool_size=20 if not settings.DATABASE_URL.startswith("sqlite") else None,
    max_overflow=40 if not settings.DATABASE_URL.startswith("sqlite") else None,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    """Get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

def init_db():
    """Initialize database tables"""
    # Import all models to ensure they are registered with Base
    from app.models.user import User
    from app.models.startup import Startup
    from app.models.report import Report
    from app.models.analysis import Analysis
    from app.models.agent import Agent
    from app.models.execution import Execution
    from app.models.subscription import Subscription
    from app.models.workflow_run import WorkflowRun
    from app.models.agent_execution import AgentExecution
    from app.models.startup_score import StartupScore
    from app.models.pitch_deck import PitchDeck
    from app.models.generated_website import GeneratedWebsite
    from app.models.memory import MemoryModel
    from app.models.notification import Notification
    from app.models.activity_log import ActivityLog
    from app.models.billing import Billing
    from app.models.feedback import Feedback
    from app.models.analytics import Analytics
    
    Base.metadata.create_all(bind=engine)

    # Programmatic column migrations for sqlite/postgres compatibility
    from sqlalchemy import text
    with engine.begin() as conn:
        cols = [
            ("market_research", "JSON"),
            ("competitor_analysis", "JSON"),
            ("financial_model", "JSON"),
            ("branding_strategy", "JSON"),
            ("gtm_plan", "JSON"),
            ("technical_architecture", "JSON"),
            ("website_copy", "JSON"),
            ("investor_readiness", "JSON"),
            ("pitch_deck", "JSON")
        ]
        is_sqlite = settings.DATABASE_URL.startswith("sqlite")
        for col_name, col_type in cols:
            try:
                if is_sqlite:
                    # SQLite does not support ADD COLUMN IF NOT EXISTS
                    conn.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE reports ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
            except Exception:
                # Column might already exist, ignore error
                pass

        # Migrate user currency column
        try:
            if is_sqlite:
                conn.execute(text("ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'"))
            else:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'"))
        except Exception:
            pass
