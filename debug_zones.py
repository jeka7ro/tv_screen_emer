import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_zones():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'])
    
    print("=" * 80)
    print("CHECKING SCREEN ZONES FOR PLAYLISTS")
    print("=" * 80)
    
    # Get all playlists
    playlists = await conn.fetch("SELECT id, name FROM playlists LIMIT 5")
    print(f"\n📋 Sample Playlists:")
    for p in playlists:
        print(f"  - {p['name']} (ID: {p['id']})")
    
    # Get all zones
    zones = await conn.fetch("SELECT * FROM screen_zones LIMIT 20")
    print(f"\n🔧 Sample Screen Zones (first 20):")
    print(f"{'Screen ID':<40} {'Zone ID':<15} {'Content Type':<15} {'Playlist ID':<40} {'Content ID':<40}")
    print("-" * 150)
    
    for z in zones:
        screen_id = str(z['screen_id'])[:36]
        zone_id = str(z['zone_id'])[:12]
        content_type = str(z.get('content_type', 'N/A'))[:12]
        playlist_id = str(z.get('playlist_id', 'NULL'))[:36]
        content_id = str(z.get('content_id', 'NULL'))[:36]
        print(f"{screen_id:<40} {zone_id:<15} {content_type:<15} {playlist_id:<40} {content_id:<40}")
    
    # Check zones with playlists
    zones_with_playlists = await conn.fetch("""
        SELECT screen_id, zone_id, content_type, playlist_id, content_id, digital_menu_id
        FROM screen_zones 
        WHERE playlist_id IS NOT NULL OR (content_type = 'playlist' AND content_id IS NOT NULL)
    """)
    
    print(f"\n✅ Zones with Playlists ({len(zones_with_playlists)} total):")
    for z in zones_with_playlists:
        screen = await conn.fetchrow("SELECT name FROM screens WHERE id = $1", z['screen_id'])
        screen_name = screen['name'] if screen else 'Unknown'
        print(f"  - Screen: {screen_name}")
        print(f"    Zone: {z['zone_id']}")
        print(f"    Content Type: {z.get('content_type', 'N/A')}")
        print(f"    Playlist ID: {z.get('playlist_id', 'NULL')}")
        print(f"    Content ID: {z.get('content_id', 'NULL')}")
        print()
    
    await conn.close()

asyncio.run(check_zones())
