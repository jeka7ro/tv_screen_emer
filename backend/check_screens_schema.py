#!/usr/bin/env python3
"""Check screens table schema"""
import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

async def check_schema():
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Get table schema
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'screens'
            ORDER BY ordinal_position
        """)
        
        print("Screens table columns:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        
        # Try to insert a test screen
        print("\nAttempting test insert...")
        try:
            await conn.execute("""
                INSERT INTO screens (
                    id, location_id, name, slug, resolution, orientation,
                    template_id, sync_group, cascade_offset, status, last_active,
                    sync_type, created_at, sync_group_name, sync_fit_mode, brand, created_by
                ) VALUES (
                    'test-id-123', '38d40400-bbee-4683-af32-0131435a26b0', 'Test', 'test-slug-debug',
                    '1920x1080', 'landscape', NULL, NULL, 0, 'offline', NULL,
                    'simple', NOW(), NULL, 'cover', NULL, 'test-user-id'
                )
            """)
            print("✅ Test insert succeeded!")
            
            # Clean up
            await conn.execute("DELETE FROM screens WHERE id = 'test-id-123'")
        except Exception as e:
            print(f"❌ Test insert failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_schema())
