import asyncio
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone
import asyncpg
from db import init_db, close_db, folder_insert, folder_list

load_dotenv()

async def test():
    await init_db()
    try:
        print("🔍 Testing folder creation...")
        folder_id = str(uuid.uuid4())
        f_dict = {
            "id": folder_id,
            "name": f"Test Folder {datetime.now().strftime('%H:%M:%S')}",
            "description": "Auto-generated test folder",
            "color": "#ff0000",
            "icon": "folder",
            "created_at": datetime.now(timezone.utc)
        }
        
        print(f"🔄 Inserting folder: {f_dict['name']}")
        new_id = await folder_insert(f_dict)
        print(f"✅ Created folder with ID: {new_id}")
        
        folders = await folder_list()
        print(f"📋 Total folders: {len(folders)}")
        for f in folders:
            print(f"   - {f['name']} ({f['id']})")
            
    except Exception as e:
        import traceback
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(test())
