import asyncio
import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

async def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Creating activity_logs table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT,
                user_name TEXT,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                level TEXT DEFAULT 'INFO',
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        
        # Add index for faster querying
        print("Creating indexes...")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs(level);")
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
