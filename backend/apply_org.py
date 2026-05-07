import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def main():
    DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if "sslmode=" not in url:
        url += "?sslmode=require"
        
    conn = await asyncpg.connect(url)
    
    # Update ALL locations
    await conn.execute("UPDATE locations SET iiko_organization_id = 'adddb5a0-26e5-4d50-b472-1c74726c3f72'")
    print("Updated ALL locations with Org ID.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
