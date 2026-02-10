import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return
    
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
        
    conn = await asyncpg.connect(url)
    try:
        print("🔄 Checking content table for file_size column...")
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'content' 
                AND column_name = 'file_size'
            );
        """)
        
        if not column_exists:
            print("📦 Adding file_size column to content table...")
            await conn.execute("ALTER TABLE content ADD COLUMN file_size BIGINT DEFAULT 0;")
            print("✅ Column added")
        else:
            print("ℹ️  Column already exists")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
