import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from db import init_db, close_db, get_database

async def fix_corrupted_urls():
    await init_db()
    db = get_database()
    
    # Fix track 1: remove trailing "https://"
    await db.execute(
        "UPDATE audio_tracks SET url = %s WHERE id = %s",
        ("https://www.youtube.com/watch?v=DRFHklnN-SM&list=RDDRFHklnN-SM&start_radio=1", 
         "8e524670-f281-449b-8d35-d86f49d22b5e")
    )
    
    # Fix track 2: remove duplicate "https://"
    await db.execute(
        "UPDATE audio_tracks SET url = %s WHERE id = %s",
        ("https://www.youtube.com/watch?v=N6DW31S_oyI&list=RDN6DW31S_oyI&start_radio=1",
         "70ede31e-4d2c-489e-84a1-d8f28560a76f")
    )
    
    print("✅ Fixed corrupted YouTube URLs!")
    
    await close_db()

if __name__ == "__main__":
    asyncio.run(fix_corrupted_urls())
