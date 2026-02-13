#!/usr/bin/env python3
"""Fix YouTube content type in database"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

async def main():
    from db import init_db, close_db, pool
    
    print("Connecting to database...")
    await init_db()
    
    content_id = 'd3a9b395-ea34-4d6d-aafd-e03637e9d76f'
    
    try:
        async with pool.acquire() as conn:
            # Update the content type
            await conn.execute(
                "UPDATE content SET type = $1 WHERE id = $2",
                'youtube', content_id
            )
            
            # Verify the update
            record = await conn.fetchrow(
                "SELECT id, title, type, file_url FROM content WHERE id = $1",
                content_id
            )
            
            if record:
                print(f"✅ Successfully updated content:")
                print(f"   ID: {record['id']}")
                print(f"   Title: {record['title'] or '(empty)'}")
                print(f"   Type: {record['type']}")
                print(f"   URL: {record['file_url'][:60]}...")
            else:
                print(f"❌ Content with ID {content_id} not found")
    
    finally:
        await close_db()

if __name__ == '__main__':
    asyncio.run(main())
