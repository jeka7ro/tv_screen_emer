import asyncio
import sys
import os

# Ensure backend directory is in python path
sys.path.append("backend")

# Import db module which handles connection and env loading
from db import init_db, users_list, close_db

async def main():
    print("Checking database for users...")
    try:
        await init_db()
        users = await users_list()
        if not users:
            print("No users found in the database.")
        else:
            print(f"Found {len(users)} users:")
            for u in users:
                print(f"- Email: {u.get('email', 'N/A')} (Name: {u.get('full_name', 'N/A')})")
    except Exception as e:
        print(f"Error checking users: {e}")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(main())
