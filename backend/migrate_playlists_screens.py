import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

async def migrate():
    print("Migrating playlists table to add screen_ids...")
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check if column exists
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'playlists' 
                AND column_name = 'screen_ids'
            );
        """)

        if not column_exists:
            print("Adding screen_ids column...")
            await conn.execute("""
                ALTER TABLE playlists 
                ADD COLUMN screen_ids JSONB DEFAULT '[]'::jsonb;
            """)
            print("Column added successfully.")
        else:
            print("Column screen_ids already exists.")

        await conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
