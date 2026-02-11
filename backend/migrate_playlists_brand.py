import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from pathlib import Path

# Load env from backend/.env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return

    print("🔄 Connecting to DB...")
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    
    # Simple SSL require for Supabase
    if "supabase.co" in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
        
    conn = await asyncpg.connect(url)
    
    try:
        print("🛠 Migrating playlists table...")
        
        # Add brand column
        try:
            await conn.execute("ALTER TABLE playlists ADD COLUMN brand TEXT;")
            print("✅ Added 'brand' column to playlists")
        except asyncpg.DuplicateColumnError:
            print("ℹ️ 'brand' column already exists")

        # Add created_by column
        try:
            await conn.execute("ALTER TABLE playlists ADD COLUMN created_by TEXT;")
            print("✅ Added 'created_by' column to playlists")
        except asyncpg.DuplicateColumnError:
            print("ℹ️ 'created_by' column already exists")

        print("\n🎉 MIGRATION COMPLETED!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
