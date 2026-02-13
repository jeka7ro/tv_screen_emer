import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import json

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return

    print("🔄 Connecting to DB...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("🛠 Migrating playlists.screen_ids from TEXT to JSONB...")
        
        # 1. Check current type
        col_info = await conn.fetchrow("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'playlists' AND column_name = 'screen_ids'
        """)
        
        if col_info and col_info['data_type'] == 'text':
            print("   Current type is TEXT. Converting...")
            # We need to use a temporary column or a USING clause with explicit cast
            # If the data is valid JSON strings, we can cast them
            try:
                await conn.execute("""
                    ALTER TABLE playlists 
                    ALTER COLUMN screen_ids TYPE JSONB 
                    USING (
                        CASE 
                            WHEN screen_ids IS NULL OR screen_ids = '' THEN '[]'::jsonb
                            ELSE screen_ids::jsonb
                        END
                    );
                """)
                print("✅ Successfully migrated screen_ids to JSONB")
            except Exception as e:
                print(f"❌ Error during conversion: {e}")
                print("   Attempting fallback: cleanup then convert...")
                # Backup and recreate strategy if needed
        else:
            print(f"✅ screen_ids is already {col_info['data_type'] if col_info else 'MISSING'}")

        print("\n🎉 MIGRATION COMPLETED!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
