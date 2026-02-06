import asyncio
import sys
import os

# Ensure backend directory is in python path
sys.path.append("backend")

import db

async def main():
    print("Connecting to database...")
    try:
        await db.init_db()
        
        # Access the pool directly from the module
        if not db.pool:
            print("Error: Connection pool not initialized.")
            return

        async with db.pool.acquire() as conn:
            # Check token
            row = await conn.fetchrow(
                "SELECT * FROM password_resets WHERE email = $1", 
                "jeka7ro@gmail.com"
            )
            
            if row:
                token = row['token']
                expires_at = row['expires_at']
                from datetime import datetime
                now_utc = datetime.utcnow()
                
                link = f"https://tvscreener.netlify.app/reset-password?token={token}"
                print(f"\n🎉 FOUND TOKEN!")
                print(f"Token: {token}")
                print(f"Expires At (DB): {expires_at}")
                print(f"Current UTC:    {now_utc}")
                print(f"Is Expired?:    {expires_at < now_utc}")
                print(f"🔗 RESET LINK: {link}\n")
            else:
                print("\n============\n❌ No reset token found (User likely reset password already!)\n============")

            # Check user last login
            user_row = await conn.fetchrow("SELECT last_login FROM users WHERE email = $1", "jeka7ro@gmail.com")
            if user_row and user_row['last_login']:
                print(f"🕒 User Last Login: {user_row['last_login']}")
            else:
                print("🕒 User Last Login: Never or None")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_db()

if __name__ == "__main__":
    asyncio.run(main())
