"""API endpoint integration tests"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test health check route returns healthy status"""
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert "timestamp" in json_data


def test_root_endpoint():
    """Test root welcome endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["message"] == "StartupForge-AI API"
    assert "version" in json_data


def test_auth_forgot_password():
    """Test forgot password endpoint runs and sends mock instructions"""
    response = client.post("/api/v1/auth/forgot-password?email=jane@domain.com")
    assert response.status_code == 200
    assert "instructions sent" in response.json()["message"]


@pytest.mark.asyncio
async def test_update_currency():
    """Test updating user currency for all supported currencies"""
    from app.database.database import AsyncSessionLocal
    from app.models.user import User
    from app.core.security import get_current_active_user
    import uuid
    from httpx import AsyncClient

    # 1. Setup: create a test user in the database
    async with AsyncSessionLocal() as db:
        test_user_id = str(uuid.uuid4())
        test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        test_user = User(
            id=test_user_id,
            email=test_email,
            full_name="Test User",
            hashed_password="hashed_password",
            role="user",
            is_active=True,
            currency="USD"
        )
        db.add(test_user)
        await db.commit()

    # 2. Dependency override: mock get_current_active_user to return our test user
    mock_user = User(id=test_user_id, email=test_email, is_active=True, role="user")
    app.dependency_overrides[get_current_active_user] = lambda: mock_user

    try:
        # 3. Test each supported currency using AsyncClient
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            supported_currencies = ["INR", "USD", "EUR", "GBP", "AED", "SGD"]
            for currency in supported_currencies:
                response = await ac.put("/api/v1/auth/me/currency", json={"currency": currency})
                assert response.status_code == 200
                json_data = response.json()
                assert json_data["currency"] == currency
                assert json_data["message"] == "Currency updated successfully"

                # Verify database actually updated
                async with AsyncSessionLocal() as db:
                    updated_user = await db.get(User, test_user_id)
                    assert updated_user.currency == currency

            # 4. Test unsupported currency
            response = await ac.put("/api/v1/auth/me/currency", json={"currency": "JPY"})
            assert response.status_code == 400
            assert "Unsupported currency" in response.json()["detail"]

    finally:
        # 5. Cleanup: delete user and clear overrides
        async with AsyncSessionLocal() as db:
            db_user = await db.get(User, test_user_id)
            if db_user:
                await db.delete(db_user)
                await db.commit()
        app.dependency_overrides.clear()


