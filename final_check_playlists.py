import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def check():
    print(f"Connecting to DB...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("\nPlaylists Table Structure:")
        rows = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'playlists'
            ORDER BY ordinal_position
        """)
        for r in rows:
            print(f"- {r['column_name']}: {r['data_type']} (Nullable: {r['is_nullable']})")
            
        print("\nChecking first few screen_ids values:")
        vals = await conn.fetch("SELECT id, name, screen_ids FROM playlists LIMIT 5")
        for v in vals:
            print(f"ID: {v['id']}, Name: {v['name']}, screen_ids type: {type(v['screen_ids'])}, value: {v['screen_ids']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
