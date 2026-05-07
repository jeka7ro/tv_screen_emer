import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

async def main():
    DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if not DATABASE_URL:
        print("Set DATABASE_URL")
        return
        
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
        
    print("Connecting to DB...")
    conn = await asyncpg.connect(url)
    
    print("Adding iiko_organization_id to locations...")
    try:
        await conn.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS iiko_organization_id TEXT;")
        print("Added iiko_organization_id to locations.")
    except Exception as e:
        print("Error locations:", e)
        
    print("Adding location_id and iiko_id to products...")
    try:
        await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS location_id TEXT;")
        await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS iiko_id TEXT;")
        print("Added location_id and iiko_id to products.")
    except Exception as e:
        print("Error products:", e)
        
    print("Truncating products...")
    try:
        await conn.execute("TRUNCATE TABLE products;")
        print("Products truncated.")
    except Exception as e:
        print("Error truncate:", e)
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
