import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient, ASGITransport
import uuid
import sys
import os

# Ensure backend is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from server import app, User, get_super_admin
from db import init_db, user_get_by_email, user_insert, user_delete

# Mock a super admin user
mock_super_admin = User(
    id=str(uuid.uuid4()),
    email="test_super@example.com",
    full_name="Test Super Admin",
    hashed_password="fake_hash",
    is_super_admin=True
)

# Dependency override for tests
async def override_get_super_admin():
    return mock_super_admin

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    await init_db()
    yield

@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_super_admin] = override_get_super_admin
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_user_management_workflow(client):
    # 1. Create a test user directly in DB
    test_user_email = f"user_{uuid.uuid4().hex[:6]}@example.com"
    test_user_data = {
        "id": str(uuid.uuid4()),
        "email": test_user_email,
        "full_name": "Verify User",
        "hashed_password": "fake_hash",
        "is_super_admin": False,
        "role": "admin",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    await user_insert(test_user_data)
    user_id = test_user_data["id"]

    try:
        # 2. Test PATCH /users/{user_id}/status (Suspend)
        response = await client.patch(f"/users/{user_id}/status", json={"status": "suspended"})
        assert response.status_code == 200
        
        await asyncio.sleep(0.5) # Give it a moment
        updated_user = await user_get_by_email(test_user_email)
        assert updated_user["status"] == "suspended"

        # 3. Test POST /users/{user_id}/reset-password
        response = await client.post(f"/users/{user_id}/reset-password", json={"new_password": "newpassword123"})
        assert response.status_code == 200

        # 4. Test PATCH /users/{user_id} (Edit Role/Location)
        response = await client.patch(f"/users/{user_id}", json={
            "full_name": "Updated Name",
            "role": "manager",
            "location_id": "loc_123"
        })
        assert response.status_code == 200
        
        await asyncio.sleep(0.5)
        updated_user = await user_get_by_email(test_user_email)
        assert updated_user["full_name"] == "Updated Name"
        assert updated_user["role"] == "manager"
        assert updated_user["location_id"] == "loc_123"

        # 5. Test DELETE /users/{user_id}
        response = await client.delete(f"/users/{user_id}")
        assert response.status_code == 200
        
        await asyncio.sleep(0.5)
        deleted_user = await user_get_by_email(test_user_email)
        assert deleted_user is None

    finally:
        # Cleanup if test failed before deletion
        try:
            await user_delete(user_id)
        except:
            pass
