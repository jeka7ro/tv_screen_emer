import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv(Path(__file__).parent / "backend" / ".env")

# Import db functions
import sys
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from db import init_db, close_db, users_list

async def main():
    await init_db()
    
    users = await users_list(exclude_password=True)
    
    print("\n=== USERS WITH AVATARS ===\n")
    for user in users:
        if user.get('avatar_url'):
            print(f"Email: {user['email']}")
            print(f"Avatar URL: {user['avatar_url']}")
            print(f"Full Name: {user.get('full_name', 'N/A')}")
            print("-" * 60)
    
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
