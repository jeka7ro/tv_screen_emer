import asyncio
import asyncpg
import os

DATABASE_URL = "postgresql://postgres.isdzbwxjtfrykyoeevmy:28Ianuarie!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

async def migrate():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("ALTER TABLE screens ADD COLUMN IF NOT EXISTS sync_fit_mode TEXT DEFAULT 'cover';")
        print("Migration successful: sync_fit_mode column added.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
