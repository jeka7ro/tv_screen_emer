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
    
    # Wipe the organization ID for Smash Me locations so they don't use the Sushi Master Org ID
    await conn.execute("UPDATE locations SET iiko_organization_id = NULL WHERE name ILIKE '%smash%'")
    print("Wiped Org ID from Smash Me locations.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
