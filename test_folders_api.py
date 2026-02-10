"""
Test script for Content Folders API endpoints
"""

import asyncio
import httpx

BASE_URL = "https://tv-screen-emer.onrender.com/api"
# For local testing: BASE_URL = "http://localhost:8000/api"

# Replace with actual credentials
TEST_EMAIL = "admin@sushimaster.ro"
TEST_PASSWORD = "your_password_here"

async def test_folders():
    async with httpx.AsyncClient() as client:
        # 1. Login
        print("🔐 Logging in...")
        login_resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_resp.status_code != 200:
            print(f"❌ Login failed: {login_resp.text}")
            return
        
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
        
        # 2. List folders (should be empty initially)
        print("\n📂 Listing folders...")
        list_resp = await client.get(f"{BASE_URL}/content/folders", headers=headers)
        print(f"Folders: {list_resp.json()}")
        
        # 3. Create a folder
        print("\n➕ Creating folder...")
        create_resp = await client.post(f"{BASE_URL}/content/folders", 
            headers=headers,
            json={
                "name": "Test Folder",
                "description": "A test folder for images",
                "color": "#10b981",
                "icon": "folder"
            }
        )
        if create_resp.status_code != 200:
            print(f"❌ Create failed: {create_resp.text}")
            return
        
        folder = create_resp.json()
        folder_id = folder["id"]
        print(f"✅ Folder created: {folder['name']} (ID: {folder_id})")
        
        # 4. Update folder
        print("\n✏️  Updating folder...")
        update_resp = await client.patch(f"{BASE_URL}/content/folders/{folder_id}",
            headers=headers,
            json={
                "name": "Updated Test Folder",
                "color": "#3b82f6"
            }
        )
        print(f"✅ Folder updated: {update_resp.json()}")
        
        # 5. List folders again
        print("\n📂 Listing folders after update...")
        list_resp = await client.get(f"{BASE_URL}/content/folders", headers=headers)
        print(f"Folders: {list_resp.json()}")
        
        # 6. Delete folder
        print(f"\n🗑️  Deleting folder {folder_id}...")
        delete_resp = await client.delete(f"{BASE_URL}/content/folders/{folder_id}", headers=headers)
        print(f"✅ {delete_resp.json()['message']}")
        
        # 7. List folders after delete
        print("\n📂 Listing folders after delete...")
        list_resp = await client.get(f"{BASE_URL}/content/folders", headers=headers)
        print(f"Folders: {list_resp.json()}")
        
        print("\n✅ All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_folders())
