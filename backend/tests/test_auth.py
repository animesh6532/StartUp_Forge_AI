import pytest
import uuid
from datetime import timedelta
from httpx import AsyncClient
from httpx import ASGITransport

from app.main import app
from app.database.database import AsyncSessionLocal, init_db, async_engine
from app.models.user import User
from app.core.security import create_access_token, get_password_hash

# Ensure database tables are initialized
init_db()

@pytest.mark.asyncio
async def test_auth_comprehensive_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"user_{unique_id}@startupforge.ai"
        test_password = "Founder@2026"
        test_name = "Sarah Chen Test"

        # -------------------------------------------------------------
        # 1. Register a new user
        # -------------------------------------------------------------
        register_payload = {
            "email": test_email,
            "password": test_password,
            "full_name": test_name
        }
        res_register = await ac.post("/api/v1/auth/register", json=register_payload)
        assert res_register.status_code == 201
        data_register = res_register.json()
        assert data_register["email"] == test_email
        assert data_register["full_name"] == test_name
        assert "id" in data_register

        # -------------------------------------------------------------
        # 2. Register with duplicate email should fail
        # -------------------------------------------------------------
        res_dup = await ac.post("/api/v1/auth/register", json=register_payload)
        assert res_dup.status_code == 400
        assert "already registered" in res_dup.json()["detail"]

        # -------------------------------------------------------------
        # 3. Login with correct credentials
        # -------------------------------------------------------------
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        data_login = res_login.json()
        assert "access_token" in data_login
        assert data_login["token_type"].lower() == "bearer"
        
        token = data_login["access_token"]

        # -------------------------------------------------------------
        # 4. Login with wrong password should fail
        # -------------------------------------------------------------
        wrong_login_payload = {
            "email": test_email,
            "password": "WrongPassword"
        }
        res_wrong_login = await ac.post("/api/v1/auth/login", json=wrong_login_payload)
        assert res_wrong_login.status_code == 401
        assert "Incorrect email or password" in res_wrong_login.json()["detail"]

        # -------------------------------------------------------------
        # 5. Access /me protected route with valid token
        # -------------------------------------------------------------
        headers = {"Authorization": f"Bearer {token}"}
        res_me = await ac.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == 200
        data_me = res_me.json()
        assert data_me["email"] == test_email
        assert data_me["full_name"] == test_name

        # -------------------------------------------------------------
        # 6. Access /me protected route with invalid token should fail
        # -------------------------------------------------------------
        bad_headers = {"Authorization": "Bearer invalidtokenhere"}
        res_me_bad = await ac.get("/api/v1/auth/me", headers=bad_headers)
        assert res_me_bad.status_code == 401

        # -------------------------------------------------------------
        # 7. Access /me with expired token should fail
        # -------------------------------------------------------------
        expired_token = create_access_token(
            data={"sub": test_email, "role": "user"},
            expires_delta=timedelta(seconds=-10)
        )
        expired_headers = {"Authorization": f"Bearer {expired_token}"}
        res_me_expired = await ac.get("/api/v1/auth/me", headers=expired_headers)
        assert res_me_expired.status_code == 401
        assert "validate credentials" in res_me_expired.json()["detail"]

        # -------------------------------------------------------------
        # 8. Logout route
        # -------------------------------------------------------------
        res_logout = await ac.post("/api/v1/auth/logout")
        assert res_logout.status_code == 200
        assert "Logged out successfully" in res_logout.json()["message"]

        # -------------------------------------------------------------
        # 9. Inactive User Test Flow
        # -------------------------------------------------------------
        inactive_email = f"inactive_{unique_id}@startupforge.ai"
        
        # Create inactive user directly in DB
        async with AsyncSessionLocal() as db:
            user = User(
                email=inactive_email,
                full_name="Inactive User Test",
                hashed_password=get_password_hash(test_password),
                role="user",
                is_active=False
            )
            db.add(user)
            await db.commit()

        try:
            # Login should fail because user is inactive
            res_inactive_login = await ac.post("/api/v1/auth/login", json={
                "email": inactive_email,
                "password": test_password
            })
            assert res_inactive_login.status_code == 401
            assert "deactivated" in res_inactive_login.json()["detail"]

            # Accessing /me with a token for an inactive user should fail
            valid_token_for_inactive = create_access_token(data={"sub": inactive_email, "role": "user"})
            res_inactive_me = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {valid_token_for_inactive}"})
            assert res_inactive_me.status_code == 400
            assert "Inactive user" in res_inactive_me.json()["detail"]

        finally:
            # Clean up inactive user record
            async with AsyncSessionLocal() as db:
                from sqlalchemy.future import select
                q = await db.execute(select(User).filter(User.email == inactive_email))
                db_inactive_user = q.scalars().first()
                if db_inactive_user:
                    await db.delete(db_inactive_user)
                    await db.commit()

        # -------------------------------------------------------------
        # Cleanup: Delete active user records (activity logs, subscription, user)
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as db:
            from sqlalchemy.future import select
            q = await db.execute(select(User).filter(User.email == test_email))
            db_user = q.scalars().first()
            if db_user:
                from app.models.activity_log import ActivityLog
                from app.models.subscription import Subscription
                
                q_log = await db.execute(select(ActivityLog).filter(ActivityLog.user_id == db_user.id))
                for log in q_log.scalars().all():
                    await db.delete(log)
                    
                q_sub = await db.execute(select(Subscription).filter(Subscription.user_id == db_user.id))
                for sub in q_sub.scalars().all():
                    await db.delete(sub)

                await db.delete(db_user)
                await db.commit()

    # Dispose connection pool to ensure no dangling connections on closed loop
    await async_engine.dispose()
