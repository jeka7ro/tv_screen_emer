import asyncio
import os
import sys
from pathlib import Path

# Fix path to include backend
sys.path.append(str(Path(__file__).parent / "backend"))

from db import init_db, _fetch_all

async def main():
    await init_db()
    users = await _fetch_all("SELECT email, full_name, role FROM users LIMIT 5")
    print("Users in database:")
    for user in users:
        print(f"- {user['email']} ({user['full_name']}, {user['role']})")

if __name__ == "__main__":
    asyncio.run(main())
