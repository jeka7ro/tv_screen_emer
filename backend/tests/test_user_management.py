import pytest
import asyncio
from httpx import AsyncClient
from server import app, User, get_super_admin
from db import user_get_by_email, user_insert, user_delete
import uuid

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

@pytest.fixture
async def client():
    app.dependency_overrides[get_super_admin] = override_get_super_admin
    async with AsyncClient(app=app, base_url="http://test") as ac:
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
        "status": "active"
    }
    await user_insert(test_user_data)
    user_id = test_user_data["id"]

    try:
        # 2. Test PATCH /users/{user_id}/status (Suspend)
        response = await client.patch(f"/users/{user_id}/status", json={"status": "suspended"})
        assert response.status_code == 200
        
        updated_user = await user_get_by_email(test_user_email)
        assert updated_user["status"] == "suspended"

        # 3. Test POST /users/{user_id}/reset-password
        response = await client.post(f"/users/{user_id}/reset-password", json={"new_password": "newpassword123"})
        assert response.status_code == 200
        # Verification that password changed would require checking hashed_password in DB

        # 4. Test PATCH /users/{user_id} (Edit Role/Location)
        response = await client.patch(f"/users/{user_id}", json={
            "full_name": "Updated Name",
            "role": "manager",
            "location_id": "loc_123"
        })
        assert response.status_code == 200
        
        updated_user = await user_get_by_email(test_user_email)
        assert updated_user["full_name"] == "Updated Name"
        assert updated_user["role"] == "manager"
        assert updated_user["location_id"] == "loc_123"

        # 5. Test DELETE /users/{user_id}
        response = await client.delete(f"/users/{user_id}")
        assert response.status_code == 200
        
        deleted_user = await user_get_by_email(test_user_email)
        assert deleted_user is None

    finally:
        # Cleanup if test failed before deletion
        await user_delete(user_id)
