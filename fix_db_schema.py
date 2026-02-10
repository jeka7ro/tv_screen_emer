import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_schema():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return

    print("🔄 Connecting to DB...")
    # Parse URL for asyncpg
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
        
    conn = await asyncpg.connect(url)
    
    try:
        # 1. Fix content_folders ID issue
        print("🛠 Fixing content_folders table...")
        # Drop table (it's empty or corrupt schema)
        await conn.execute("DROP TABLE IF EXISTS content_folders CASCADE;")
        print("   Dropped content_folders")
        
        # Recreate with SERIAL
        await conn.execute("""
            CREATE TABLE content_folders (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#6366f1',
                icon TEXT DEFAULT 'folder',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        print("✅ Recreated content_folders with SERIAL id")

        # 2. Add folder_id to content if missing (cleanup from drop cascade)
        print("🛠 Checking content.folder_id...")
        
        # Check type of folder_id
        folder_id_type = await conn.fetchval("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'content' AND column_name = 'folder_id'
        """)
        
        if folder_id_type == 'text':
            print("   folder_id is TEXT, dropping to recreate as INTEGER...")
            await conn.execute("ALTER TABLE content DROP COLUMN folder_id;")
            folder_id_type = None
        
        if not folder_id_type:
             await conn.execute("""
                ALTER TABLE content 
                ADD COLUMN folder_id INTEGER REFERENCES content_folders(id) ON DELETE SET NULL;
            """)
             print("✅ Added folder_id column (INTEGER) to content")
        else:
             print("   folder_id column exists (INTEGER), adding FK constraint...")
             try:
                await conn.execute("""
                    ALTER TABLE content 
                    ADD CONSTRAINT content_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES content_folders(id) ON DELETE SET NULL;
                """)
                print("✅ FK constraint added")
             except asyncpg.DuplicateObjectError:
                print("   FK constraint already exists")

        # 3. Fix missing source_type in content
        print("🛠 Checking content.source_type...")
        try:
            await conn.execute("ALTER TABLE content ADD COLUMN source_type TEXT DEFAULT 'local';")
            print("✅ Added source_type column")
        except asyncpg.DuplicateColumnError:
            print("✅ source_type column already exists")

        print("\n🎉 SCHEMA FIX COMPLETED!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_schema())
