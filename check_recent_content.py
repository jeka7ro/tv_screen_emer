import asyncio
from backend import db

async def check_recent():
    try:
        await db.init_db()
        # query last 5 content items
        query = "SELECT id, title, folder_id, created_at FROM content ORDER BY created_at DESC LIMIT 5"
        rows = await db._fetch_all(query)
        print("Recent content items:")
        for row in rows:
            print(f"- ID: {row['id']} | Title: {row['title']} | Folder ID: {row['folder_id']} | Created: {row['created_at']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_recent())
