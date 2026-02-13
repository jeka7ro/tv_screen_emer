import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return

    print("🔄 Connecting to DB...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("🛠 Checking playlists.color column...")
        try:
            await conn.execute("ALTER TABLE playlists ADD COLUMN color TEXT DEFAULT '#4F46E5';")
            print("✅ Added color column to playlists table")
        except asyncpg.DuplicateColumnError:
            print("✅ color column already exists")
            
        print("\n🎉 MIGRATION COMPLETED!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
