import asyncio
import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv

async def check_counts():
    ROOT_DIR = Path(".")
    load_dotenv(ROOT_DIR / "backend" / ".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("No DATABASE_URL found")
        return

    print(f"Connecting to: {url.split('@')[-1]}") # Print host only for security
    
    try:
        conn = await asyncpg.connect(url)
        tables = ['users', 'locations', 'screens', 'content', 'playlists', 'products', 'digital_menus']
        for table in tables:
            count = await conn.fetchval(f"SELECT count(*) FROM {table}")
            print(f"Table {table}: {count} rows")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_counts())
