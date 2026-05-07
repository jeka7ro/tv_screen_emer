import asyncio
from db import init_db, screen_get, screen_zones_list, playlist_get, content_get, screens_list

async def main():
    await init_db()
    screens = await screens_list()
    mect4 = next((s for s in screens if s.get('slug') == 'mect4'), None)
    if not mect4:
        print("Screen mect4 not found")
        return
    
    print("Found screen mect4:", mect4["id"])
    zones = await screen_zones_list(mect4["id"])
    print("Zones:", len(zones))
    
    for z in zones:
        print("Zone config:", z)
        if z.get("content_type") == "playlist" and z.get("playlist_id"):
            playlist = await playlist_get(z["playlist_id"])
            print("Playlist name:", playlist.get("name"))
            items = playlist.get("items", [])
            print("Items count:", len(items))
            for i, item in enumerate(items):
                content = await content_get(item["content_id"])
                if content:
                    print(f"  Item {i+1}: {content.get('title')} ({content.get('type')}) - file_url: {content.get('file_url')} - thumb: {content.get('thumbnail_url')}")
                else:
                    print(f"  Item {i+1}: content_id {item['content_id']} NOT FOUND in content database!")

if __name__ == "__main__":
    asyncio.run(main())
