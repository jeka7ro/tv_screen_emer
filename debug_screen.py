import asyncio
import sys
import os
import json

# Ensure backend directory is in python path
sys.path.append("backend")

import db

# Mocking the predefined templates from server.py to check consistency
PREDEFINED_TEMPLATES = [
    {"id": "fullscreen"},
    {"id": "split-horizontal"}
]

async def main():
    print("Connecting to database...")
    try:
        await db.init_db()
        
        slug = "bc1" # From user screenshot
        print(f"Inspecting screen with slug: {slug}")

        async with db.pool.acquire() as conn:
            # Get screen
            screen = await conn.fetchrow("SELECT * FROM screens WHERE slug = $1", slug)
            if not screen:
                print("❌ Screen not found!")
                return
            
            print("\n=== SCREEN DATA ===")
            for key, value in screen.items():
                print(f"{key}: {value}")
            
            template_id = screen['template_id']
            print(f"\nTemplate ID: '{template_id}'")
            
            # Check if template is valid
            is_valid = any(t['id'] == template_id for t in PREDEFINED_TEMPLATES)
            if is_valid:
                print("✅ Template ID is VALID (exists in predefined list).")
            else:
                print(f"❌ Template ID is INVALID! (Not in { [t['id'] for t in PREDEFINED_TEMPLATES] })")
                
            # Check zones
            zones = await conn.fetch("SELECT * FROM screen_zones WHERE screen_id = $1", screen['id'])
            print(f"\n=== ZONES ({len(zones)}) ===")
            for z in zones:
                print(dict(z))
                if z['content_id']:
                    print(f"   Checking content {z['content_id']}...")
                    content = await conn.fetchrow("SELECT * FROM content WHERE id = $1", z['content_id'])
                    if content:
                        print(f"   ✅ CONTENT FOUND: {dict(content)}")
                        # Check disk existence
                        if content['file_url'] and content['file_url'].startswith('/api/uploads'):
                            rel_path = content['file_url'].replace('/api/uploads/', '')
                            # Assume script runs from root, so backend/uploads/...
                            file_path = os.path.join("backend", "uploads", rel_path)
                            if os.path.exists(file_path):
                                print(f"   ✅ FILE EXISTS ON DISK: {file_path}")
                            else:
                                print(f"   ❌ FILE MISSING ON DISK: {file_path}")
                    else:
                        print(f"   ❌ CONTENT NOT FOUND!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_db()

if __name__ == "__main__":
    asyncio.run(main())
