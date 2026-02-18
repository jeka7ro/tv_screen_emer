import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv(Path(__file__).parent / "backend" / ".env")

# Import db functions
import sys
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from db import init_db, close_db, database

async def main():
    await init_db()
    
    # Get all audio playlists
    query = "SELECT id, name, created_at FROM audio_playlists ORDER BY created_at DESC LIMIT 10"
    rows = await database.fetch_all(query)
    
    print("\n=== AUDIO PLAYLISTS ===\n")
    if rows:
        for row in rows:
            print(f"ID: {row['id']}")
            print(f"Name: {row['name']}")
            print(f"URL: https://smr.onl/play-audio/{row['id']}")
            print("-" * 60)
    else:
        print("No audio playlists found!")
    
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
