"""
Add fit_mode column to screen_zones table.
"""
import os
import asyncio
import asyncpg
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

async def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return
    
    url = DATABASE_URL
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        url += "?sslmode=require" if "?" not in url else "&sslmode=require"
    
    conn = await asyncpg.connect(url)
    try:
        exists = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'screen_zones' AND column_name = 'fit_mode'
        """)
        
        if exists == 0:
            await conn.execute("""
                ALTER TABLE screen_zones 
                ADD COLUMN fit_mode TEXT DEFAULT 'cover'
            """)
            print("✅ Added fit_mode column to screen_zones")
        else:
            print("ℹ️  fit_mode column already exists")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
