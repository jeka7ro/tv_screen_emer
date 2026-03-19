import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv("backend/.env")

async def main():
    url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if "?" not in url:
        url += "?sslmode=require"
    else:
        url += "&sslmode=require"
        
    conn = await asyncpg.connect(url)
    try:
        # Check raw status
        rows = await conn.fetch("SELECT id, name, status, last_active, NOW() - last_active as diff FROM screens")
        print("--- ALL SCREENS ---")
        for r in rows:
            print(dict(r))
            
        # Check count query
        count_all = await conn.fetchval("SELECT count(*)::int FROM screens WHERE last_active >= NOW() - INTERVAL '20 minutes'")
        print(f"\nCount online (all): {count_all}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
