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
        # Check column types explicitly
        cols = await conn.fetch("""
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'playlists'
        """)
        print("\nPlaylists Columns:")
        for c in cols:
            print(f" - {c['column_name']}: {c['data_type']} ({c['udt_name']})")

        # Test if we can insert a list into screen_ids
        print("\nTesting list insertion into screen_ids...")
        try:
            # Get an existing ID
            row = await conn.fetchrow("SELECT id FROM playlists LIMIT 1")
            if row:
                pid = row['id']
                await conn.execute("UPDATE playlists SET screen_ids = $1 WHERE id = $2", ['test'], pid)
                print("✅ Successfully updated with list!")
            else:
                print("No playlists found to test.")
        except Exception as e:
            print(f"❌ Failed to update with list: {e}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
