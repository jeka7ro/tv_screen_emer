import asyncio
import os
import asyncpg
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

async def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL or SUPABASE_DB_URL not found in .env")
        return

    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Adding 'role' and 'location_id' columns to 'users' table...")
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
            ADD COLUMN IF NOT EXISTS location_id TEXT;
        """)
        
        print("Adding 'role' and 'location_id' columns to 'invitations' table...")
        await conn.execute("""
            ALTER TABLE invitations 
            ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
            ADD COLUMN IF NOT EXISTS location_id TEXT;
        """)
        
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
