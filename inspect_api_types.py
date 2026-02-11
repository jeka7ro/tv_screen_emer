import asyncio
from backend import db
import json

async def inspect_api_types():
    try:
        await db.init_db()
        items = await db.content_list()
        if items:
            # Check the most recent item (which we know has a folder_id)
            # Find the item with id 92cb94c0-ba00-4eae-95c4-c2e57a8900ca
            target_id = '92cb94c0-ba00-4eae-95c4-c2e57a8900ca'
            item = next((i for i in items if i['id'] == target_id), None)
            if item:
                print(f"Item found: {item['title']}")
                print(f"folder_id value: {item.get('folder_id')}")
                print(f"folder_id type: {type(item.get('folder_id'))}")
            else:
                print(f"Item {target_id} not found in content_list output.")
                # Print the first item just in case
                first = items[0]
                print(f"First item: {first['title']} | folder_id: {first.get('folder_id')} | type: {type(first.get('folder_id'))}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_api_types())
