import asyncio
import json
from db import init_db, content_get_by_id

async def check_content():
    await init_db()
    
    # Content IDs from br1 zones
    content_ids = [
        '5f4972e0-ba06-41e2-87f7-bb746beb885d',  # zone2
        '93df7c8f-1aa8-447c-9a9f-f95d823d7142'   # zone1
    ]
    
    for cid in content_ids:
        content = await content_get_by_id(cid)
        if content:
            print(f"\nContent ID: {cid}")
            print(f"  Title: {content.get('title', 'N/A')}")
            print(f"  Type: {content.get('type', 'N/A')}")
            print(f"  URL: {content.get('file_url', 'N/A')}")
        else:
            print(f"\nContent ID {cid} not found")

if __name__ == "__main__":
    asyncio.run(check_content())
