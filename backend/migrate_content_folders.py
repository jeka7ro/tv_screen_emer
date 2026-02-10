"""
Migration: Add Content Folders Support
Creates content_folders table and adds folder_id to content table
"""

import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    """Run migration to add content folders support"""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment")
        return
    
    # Parse URL for asyncpg
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    
    print("🔄 Connecting to database...")
    conn = await asyncpg.connect(url)
    
    try:
        print("📦 Re-creating content_folders table (ensuring TEXT IDs)...")
        # Drop and recreate to ensure types are correct (since it's a new feature)
        await conn.execute("DROP TABLE IF EXISTS content_folders CASCADE;")
        
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS content_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#6366f1',
                icon TEXT DEFAULT 'folder',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        print("✅ content_folders table created with TEXT IDs")
        
        print("🔄 Adding folder_id column to content table...")
        # Check if column already exists
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'content' 
                AND column_name = 'folder_id'
            );
        """)
        
        if not column_exists:
            await conn.execute("""
                ALTER TABLE content 
                ADD COLUMN folder_id TEXT;
            """)
            print("✅ folder_id column added to content table")
            
            print("🔄 Creating index on content.folder_id...")
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_content_folder ON content(folder_id);
            """)
            print("✅ Index created")
        else:
            # If it exists, ensure it's TEXT
            print("ℹ️  folder_id column already exists, ensuring it's TEXT")
            await conn.execute("""
                ALTER TABLE content ALTER COLUMN folder_id TYPE TEXT;
            """)
            print("✅ folder_id column type verified as TEXT")
        
        # Verify schema
        print("\n📊 Verifying schema...")
        folders_count = await conn.fetchval("SELECT COUNT(*) FROM content_folders;")
        content_count = await conn.fetchval("SELECT COUNT(*) FROM content;")
        
        print(f"✅ Migration completed successfully!")
        print(f"   - content_folders: {folders_count} rows")
        print(f"   - content: {content_count} rows")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("🔌 Database connection closed")

if __name__ == "__main__":
    asyncio.run(migrate())
