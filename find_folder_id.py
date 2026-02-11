import asyncio
from backend import db

async def find_folder():
    try:
        await db.init_db()
        folders = await db.folder_list()
        for f in folders:
            if 'Sushi' in f['name']:
                print(f"Found Folder: Name: {f['name']} | ID: {f['id']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(find_folder())
