import asyncio
from db import init_db, screens_list

async def run():
    await init_db()
    screens = await screens_list()
    smash_screens = [s for s in screens if "smash" in s.get("name", "").lower() or "smash" in s.get("slug", "").lower()]
    for s in smash_screens:
        print(f"Name: {s.get('name')} | Slug: {s.get('slug')} | Orientation: {s.get('orientation')}")

asyncio.run(run())
