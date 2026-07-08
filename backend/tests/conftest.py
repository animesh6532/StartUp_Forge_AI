import pytest
import asyncio
from app.database.database import async_engine

@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
def dispose_engine_pool(event_loop):
    """Dispose of the connection pool before and after every test using the session event loop."""
    event_loop.run_until_complete(async_engine.dispose())
    yield
    event_loop.run_until_complete(async_engine.dispose())
