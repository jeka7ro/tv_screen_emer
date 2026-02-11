import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from db import init_db, close_db, user_get_by_email

load_dotenv()

async def check_user():
    await init_db()
    try:
        email = "sandukatherine@gmail.com"
        user = await user_get_by_email(email)
        if user:
            print(f"User found: {user.get('full_name')}")
            print(f"Email (repr): {repr(user.get('email'))}")
            print(f"Role: {user.get('role')}")
            print(f"Is Super Admin: {user.get('is_super_admin')}")
            print(f"Last Login Before Update: {user.get('last_login')}")
            
            # Try manual update
            from db import user_update_last_login
            print("Attempting manual update of last_login...")
            await user_update_last_login(user.get('email'))
            
            # Fetch again
            user_after = await user_get_by_email(email)
            print(f"Last Login After Update: {user_after.get('last_login')}")
            
        else:
            print(f"User with email {email} not found.")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(check_user())
