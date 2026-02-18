"""
Add sakura_enabled and sakura_intensity columns to screens table.
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
        # Check if columns already exist
        exists = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'screens' AND column_name = 'sakura_enabled'
        """)
        
        if exists == 0:
            await conn.execute("""
                ALTER TABLE screens 
                ADD COLUMN sakura_enabled BOOLEAN DEFAULT FALSE,
                ADD COLUMN sakura_intensity TEXT DEFAULT 'medium'
            """)
            print("✅ Added sakura_enabled and sakura_intensity columns")
        else:
            print("ℹ️  Columns already exist, skipping")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
