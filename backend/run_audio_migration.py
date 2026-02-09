import asyncio
import os
import asyncpg
from pathlib import Path
from dotenv import load_dotenv

# Setup paths
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

# DB URL
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

# Migration File
MIGRATION_FILE = BASE_DIR.parent / "supabase/migrations/20240209_audio_streaming.sql"

async def run_migration():
    if not DATABASE_URL:
        print("❌ Error: No DATABASE_URL found in .env")
        return

    print(f"🔌 Connecting to database...")
    
    # Fix URL for asyncpg if needed
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://")
    
    # Simple fix for sslmode
    if "supabase" in url and "sslmode=" not in url:
        if "?" in url:
             url += "&sslmode=require"
        else:
             url += "?sslmode=require"

    try:
        conn = await asyncpg.connect(url)
        print("✅ Connected.")
        
        # Read SQL
        print(f"📖 Reading migration file: {MIGRATION_FILE}")
        with open(MIGRATION_FILE, "r") as f:
            sql_content = f.read()
            
        # Execute
        print("🚀 Executing migration...")
        await conn.execute(sql_content)
        print("✨ Migration completed successfully!")
        
        await conn.close()
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
