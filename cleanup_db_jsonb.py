import asyncio
import os
import asyncpg
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def cleanup():
    print(f"Connecting to DB...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check Playlists
        print("\nCleaning up Playlists table...")
        rows = await conn.fetch("SELECT id, screen_ids FROM playlists")
        updated_count = 0
        for r in rows:
            sid = r['id']
            val = r['screen_ids']
            if isinstance(val, str):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        await conn.execute("UPDATE playlists SET screen_ids = $1 WHERE id = $2", parsed, sid)
                        updated_count += 1
                except:
                    # If it's a non-JSON string, maybe it's a comma-separated list or something?
                    # For now just make it an empty list if it's junk
                    await conn.execute("UPDATE playlists SET screen_ids = $1 WHERE id = $2", [], sid)
                    updated_count += 1
        print(f"Updated {updated_count} playlists.")

        # Check Activity Logs (if any have string details)
        print("\nCleaning up Activity Logs table...")
        rows = await conn.fetch("SELECT id, details FROM activity_logs")
        updated_count = 0
        for r in rows:
            aid = r['id']
            val = r['details']
            if isinstance(val, str):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, dict):
                        await conn.execute("UPDATE activity_logs SET details = $1 WHERE id = $2", parsed, aid)
                        updated_count += 1
                except:
                    pass
        print(f"Updated {updated_count} activity logs.")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
