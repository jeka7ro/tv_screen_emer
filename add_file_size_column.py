import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate_file_size():
    if not DATABASE_URL:
        print("❌ DATABASE_URL missing")
        return

    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
        
    print(f"🔄 Connecting to DB...")
    conn = await asyncpg.connect(url)
    try:
        # Check if column exists
        exists = await conn.fetchval("""
            SELECT count(*) 
            FROM information_schema.columns 
            WHERE table_name = 'content' AND column_name = 'file_size'
        """)
        
        if exists == 0:
            print("Adding file_size column...")
            await conn.execute("ALTER TABLE content ADD COLUMN file_size BIGINT DEFAULT 0")
            print("✅ Column added.")
        else:
            print("ℹ️ Column file_size already exists.")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_file_size())
