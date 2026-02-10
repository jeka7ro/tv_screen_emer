import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    url = os.getenv("DATABASE_URL")
    print(f"Connecting to {url}...")
    conn = await asyncpg.connect(url)
    try:
        print("Adding 'status' column to 'users' table...")
        await conn.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        """)
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
