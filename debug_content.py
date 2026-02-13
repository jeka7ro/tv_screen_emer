
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from db import init_db, close_db, content_get, playlist_get

async def debug_content():
    await init_db()
    try:
        # Check content IDs for br1
        ids = [
            "6ab0a5fc-a2e6-4086-8b94-b89994a74f0a", # zone1 content
            "5f4972e0-ba06-41e2-87f7-bb746beb885d", # zone2 content
            "e164e897-2268-4600-93a6-4ed755536433", # bc1-3 content
        ]
        
        print("Checking Content:")
        for cid in ids:
            c = await content_get(cid)
            if c:
                print(f"  [OK] Content {cid}: {c.get('title')} ({c.get('type')}) - {c.get('file_url')}")
            else:
                print(f"  [MISSING] Content {cid}")
                
        # Check playlist for mev1
        pid = "709ca57d-8f95-44f0-b2d6-d6843d77a068"
        print(f"\nChecking Playlist {pid} (mev1):")
        p = await playlist_get(pid)
        if p:
            print(f"  [OK] Playlist {p.get('name')}, Items: {len(p.get('items', []))}")
        else:
            print(f"  [MISSING] Playlist {pid}")

    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(debug_content())
