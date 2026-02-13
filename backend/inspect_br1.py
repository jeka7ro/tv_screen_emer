
import asyncio
import json
from db import pool, init_db, screen_get_by_slug, screen_zones_list

async def check_br1():
    await init_db()
    slug = 'br1'
    screen = await screen_get_by_slug(slug)
    print(f"Screen {slug}:")
    print(json.dumps(dict(screen), indent=2, default=str))
    
    zones = await screen_zones_list(screen['id'])
    print("\nZones config:")
    for z in zones:
        print(json.dumps(dict(z), indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(check_br1())
