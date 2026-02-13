
import asyncio
import json
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from db import init_db, close_db, screens_list, screen_zones_list

async def debug_all_screens():
    await init_db()
    try:
        screens = await screens_list()
        print(f"Found {len(screens)} screens:")
        for s in screens:
            print(f"\n--- SCREEN: {s['name']} (Slug: {s['slug']}) ---")
            print(f"ID: {s['id']}")
            print(f"Template ID: {s.get('template_id')}")
            print(f"Sync Group: {s.get('sync_group')}")
            
            zones_config = await screen_zones_list(s['id'])
            print(f"Zones config ({len(zones_config)}):")
            for zc in zones_config:
                print(f"  - Zone ID: {zc.get('zone_id')}, Type: {zc.get('content_type')}")
                if zc.get('content_id'):
                    print(f"    Content ID: {zc.get('content_id')}")
                if zc.get('playlist_id'):
                    print(f"    Playlist ID: {zc.get('playlist_id')}")
                if zc.get('digital_menu_id'):
                    print(f"    Menu ID: {zc.get('digital_menu_id')}")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(debug_all_screens())
