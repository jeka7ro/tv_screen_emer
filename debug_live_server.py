import requests
import json
import json
# from backend.server import create_access_token # REMOVED to avoid import errors
# I will use the login endpoint to get a token FIRST.

BASE_URL = "https://tv-screen-emer.onrender.com"

def debug_live():
    print(f"🌍 Testing {BASE_URL}...")
    
    # 1. Login to get token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": "test_last_login@example.com",
        "password": "debug123"
    }
    
    print(f"🔑 Logging in as {login_payload['email']}...")
    try:
        r = requests.post(login_url, json=login_payload, verify=False)
        if r.status_code != 200:
            print(f"❌ Login failed: {r.status_code} {r.text}")
            return
        
        token_data = r.json()
        token = token_data["access_token"]
        print("✅ Login successful!")
    except Exception as e:
        print(f"❌ Login request crashed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check Version
    try:
        r = requests.get(f"{BASE_URL}/api/version", verify=False)
        print(f"ℹ️  Version Check: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ Version check failed: {e}")

    # 3. Create Folder
    print("📂 Attempting to create folder via API...")
    payload = {
        "name": "Live Debug Folder",
        "description": "Created by debug script",
        "color": "#ff0000",
        "icon": "bug"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/api/content/folders", json=payload, headers=headers, verify=False)
        print(f"👉 Status: {r.status_code}")
        print(f"👉 Response: {r.text}")
        print(f"👉 Headers: {r.headers}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    debug_live()
