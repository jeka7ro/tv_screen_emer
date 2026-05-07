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
    
    rows = await conn.fetch("SELECT id, name, iiko_organization_id FROM locations")
    for r in rows:
        print(f"Location: {r['name']} | ID: {r['id']} | Org: {r['iiko_organization_id']}")
    
    await conn.close()

asyncio.run(main())
