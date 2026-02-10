import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import bcrypt

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def reset_password():
    if not DATABASE_URL:
        print("❌ DATABASE_URL missing")
        return

    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
        
    print(f"🔄 Connecting to DB...")
    conn = await asyncpg.connect(url)
    try:
        email = "test_last_login@example.com"
        password = "debug123"
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        # Check if user exists
        exists = await conn.fetchval("SELECT id FROM users WHERE email = $1", email)
        if not exists:
            print(f"User {email} not found. Creating...")
            await conn.execute("""
                INSERT INTO users (email, full_name, hashed_password, role, status)
                VALUES ($1, 'Debug User', $2, 'admin', 'active')
            """, email, hashed)
        else:
            print(f"Resetting password for {email}...")
            await conn.execute("UPDATE users SET hashed_password = $1 WHERE email = $2", hashed, email)
            
        print("✅ Password reset to 'debug123'")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(reset_password())
